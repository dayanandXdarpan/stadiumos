"""
Async Pub/Sub subscriber for StadiumOS.
Parses incoming sensor payloads and updates the blackboard.
Gracefully degrades when GCP credentials are absent.
"""

import asyncio
import json
import logging
import os

logger = logging.getLogger("stadiumos.gcp.pubsub_subscriber")

_subscriber_available = False


async def start_subscriber(blackboard, broadcast_fn) -> None:
    """
    Start the async Pub/Sub streaming pull subscription.
    Falls back gracefully if google-cloud-pubsub is not configured.
    """
    global _subscriber_available

    project_id   = os.getenv("GCP_PROJECT_ID", "stadiumos-demo")
    subscription = os.getenv("PUBSUB_SUBSCRIPTION", "stadium-events-sub")
    subscription_path = f"projects/{project_id}/subscriptions/{subscription}"

    try:
        from google.cloud import pubsub_v1  # type: ignore
        from google.api_core.exceptions import GoogleAPICallError  # type: ignore

        _subscriber_available = True
        logger.info("Pub/Sub subscriber starting on %s.", subscription_path)

        loop = asyncio.get_event_loop()

        def _callback(message):
            """Synchronous callback — schedules async processing on the event loop."""
            try:
                data = json.loads(message.data.decode("utf-8"))
                asyncio.run_coroutine_threadsafe(
                    _process_message(data, blackboard, broadcast_fn), loop
                )
                message.ack()
            except Exception as exc:
                logger.error("Pub/Sub message processing error: %s", exc)
                message.nack()

        subscriber = pubsub_v1.SubscriberClient()
        future = subscriber.subscribe(subscription_path, callback=_callback)

        logger.info("Pub/Sub subscriber active. Waiting for messages …")

        # Run in background; let FastAPI lifecycle manage teardown
        try:
            await asyncio.get_event_loop().run_in_executor(None, future.result)
        except Exception as exc:
            logger.error("Pub/Sub future ended: %s", exc)

    except ImportError:
        logger.warning(
            "google-cloud-pubsub not installed or credentials absent — "
            "Pub/Sub subscriber disabled."
        )
    except Exception as exc:
        logger.warning(
            "Pub/Sub subscriber unavailable — local-only mode. Reason: %s", exc
        )


async def _process_message(data: dict, blackboard, broadcast_fn) -> None:
    """
    Handle a parsed Pub/Sub message payload.
    Expected format mirrors mock_ingestor.py output.
    """
    try:
        msg_type = data.get("type")

        if msg_type == "sensor_batch":
            # Update sectors from batch payload
            for sector_data in data.get("sectors", []):
                sector_id = sector_data.get("sectorId")
                if not sector_id:
                    continue

                density      = sector_data.get("density", 0)
                velocity     = sector_data.get("velocity", 0.0)
                audio_anomaly = sector_data.get("audioAnomaly", 0.0)

                cps = (
                    0.40 * (density / 500.0)
                    + 0.35 * (velocity / 2.0)
                    + 0.25 * audio_anomaly
                )
                cps = round(min(cps, 1.0), 4)

                update = {
                    "sectorId":     sector_id,
                    "density":      density,
                    "velocity":     round(velocity, 3),
                    "audioAnomaly": round(audio_anomaly, 3),
                    "cps":          cps,
                }
                await blackboard.update_sector(sector_id, update)

            # Check weather payload
            weather = data.get("weather", {})
            if weather.get("stormProbability", 0) > 0.7 and not blackboard.storm_active:
                logger.info("Pub/Sub: high storm probability → activating storm.")
                blackboard.storm_active = True

            # Check gate fraud flags
            for gate in data.get("gates", []):
                if gate.get("fraudFlag") and gate.get("gateId"):
                    await blackboard.trigger_fraud(gate["gateId"])

        else:
            logger.debug("Pub/Sub: unrecognised message type '%s' — ignored.", msg_type)

    except Exception as exc:
        logger.exception("_process_message error: %s", exc)
