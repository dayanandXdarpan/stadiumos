#!/usr/bin/env python3
"""
mock_ingestor.py — Standalone Pub/Sub mock data generator for StadiumOS.

Usage:
    python mock_ingestor.py
    python mock_ingestor.py --storm
    python mock_ingestor.py --surge B2
    python mock_ingestor.py --storm --surge A3

Publishes realistic sensor_batch payloads to the `stadium-events` Pub/Sub topic
every 2 seconds.  Requires GOOGLE_APPLICATION_CREDENTIALS to be set (or ADC).
"""

import argparse
import json
import os
import random
import sys
import time
from datetime import datetime, timezone

# ── Sector / gate config ───────────────────────────────────────────────────
SECTOR_ROWS = ["A", "B", "C", "D"]
SECTOR_COLS = ["1", "2", "3", "4"]
ALL_SECTORS = [f"{r}{c}" for r in SECTOR_ROWS for c in SECTOR_COLS]
ALL_GATES   = [f"Gate-{ch}" for ch in "ABCDEFGH"]


def _sector_payload(sector_id: str, surge: bool, storm: bool) -> dict:
    if surge:
        density       = random.randint(350, 500)
        velocity      = round(random.uniform(1.2, 2.0), 2)
        audio_anomaly = round(random.uniform(0.5, 0.95), 2)
    elif storm:
        density       = random.randint(100, 300)
        velocity      = round(random.uniform(0.8, 1.6), 2)
        audio_anomaly = round(random.uniform(0.3, 0.7), 2)
    else:
        density       = random.randint(20, 200)
        velocity      = round(random.uniform(0.1, 1.5), 2)
        audio_anomaly = round(random.uniform(0.0, 0.8), 2)

    return {
        "sectorId":     sector_id,
        "density":      density,
        "velocity":     velocity,
        "audioAnomaly": audio_anomaly,
    }


def _gate_payload(gate_id: str) -> dict:
    fraud_flag = random.random() < 0.03   # 3 % chance of fraud per gate per tick
    return {
        "gateId":    gate_id,
        "scanRate":  random.randint(5, 20),
        "fraudFlag": fraud_flag,
    }


def _weather_payload(storm: bool) -> dict:
    if storm:
        condition        = random.choice(["HEAVY_RAIN", "STORM"])
        wind_speed       = round(random.uniform(20, 45), 1)
        storm_probability = round(random.uniform(0.75, 0.99), 2)
    else:
        condition        = random.choice(["CLEAR", "CLOUDY", "DRIZZLE"])
        wind_speed       = round(random.uniform(0, 15), 1)
        storm_probability = round(random.uniform(0.0, 0.25), 2)

    return {
        "condition":        condition,
        "windSpeed":        wind_speed,
        "stormProbability": storm_probability,
    }


def build_payload(surge_sector: str | None, storm: bool) -> dict:
    sectors = [
        _sector_payload(s, surge=s == surge_sector, storm=storm)
        for s in ALL_SECTORS
    ]
    gates   = [_gate_payload(g) for g in ALL_GATES]
    weather = _weather_payload(storm)

    return {
        "type":      "sensor_batch",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sectors":   sectors,
        "gates":     gates,
        "weather":   weather,
    }


def main():
    parser = argparse.ArgumentParser(description="StadiumOS mock Pub/Sub ingestor")
    parser.add_argument("--storm",  action="store_true", help="Simulate active storm")
    parser.add_argument("--surge",  metavar="SECTOR_ID",  help="Inject surge into sector (e.g. B2)")
    args = parser.parse_args()

    storm        = args.storm
    surge_sector = args.surge.upper() if args.surge else None

    if surge_sector and surge_sector not in ALL_SECTORS:
        print(f"ERROR: Unknown sector '{surge_sector}'. Valid sectors: {ALL_SECTORS}", file=sys.stderr)
        sys.exit(1)

    project_id  = os.getenv("GCP_PROJECT_ID", "stadiumos-demo")
    topic_id    = os.getenv("PUBSUB_TOPIC", "stadium-events")
    topic_path_str = f"projects/{project_id}/topics/{topic_id}"

    try:
        from google.cloud import pubsub_v1  # type: ignore
        publisher   = pubsub_v1.PublisherClient()
        topic_path  = publisher.topic_path(project_id, topic_id)
        print(f"[StadiumOS Ingestor] Connected to Pub/Sub topic: {topic_path}")
        use_pubsub = True
    except Exception as exc:
        print(f"[StadiumOS Ingestor] WARNING: Pub/Sub unavailable ({exc}). Printing to stdout only.")
        use_pubsub = False

    tick = 0
    print(f"[StadiumOS Ingestor] Starting — storm={storm}, surge={surge_sector}")
    print("[StadiumOS Ingestor] Press Ctrl+C to stop.\n")

    try:
        while True:
            tick += 1
            payload = build_payload(surge_sector=surge_sector, storm=storm)
            data_bytes = json.dumps(payload).encode("utf-8")

            if use_pubsub:
                try:
                    future = publisher.publish(topic_path, data_bytes)
                    msg_id = future.result(timeout=5)
                    print(f"[Tick {tick:04d}] Published message_id={msg_id} | "
                          f"storm={storm} | surge={surge_sector}")
                except Exception as exc:
                    print(f"[Tick {tick:04d}] Publish ERROR: {exc}")
            else:
                # Pretty-print to console as fallback
                print(f"[Tick {tick:04d}] {json.dumps(payload, indent=2)[:300]} …")

            time.sleep(2)

    except KeyboardInterrupt:
        print("\n[StadiumOS Ingestor] Stopped.")


if __name__ == "__main__":
    main()
