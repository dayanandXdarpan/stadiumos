"""
Firestore helper for StadiumOS.
Gracefully degrades to local-only mode when credentials are absent.
"""

import logging
import os

logger = logging.getLogger("stadiumos.gcp.firestore_client")

_firestore_client = None
_firestore_available = False


def _get_client():
    global _firestore_client, _firestore_available

    if _firestore_client is not None:
        return _firestore_client

    try:
        from google.cloud import firestore  # type: ignore

        project_id = os.getenv("GCP_PROJECT_ID", "stadiumos-demo")
        _firestore_client = firestore.AsyncClient(project=project_id)
        _firestore_available = True
        logger.info("Firestore client initialised (project=%s).", project_id)
    except Exception as exc:
        logger.warning(
            "Firestore client unavailable — running in local-only mode. Reason: %s", exc
        )
        _firestore_available = False

    return _firestore_client


async def write_state(collection: str, doc_id: str, data: dict) -> bool:
    """
    Upsert *data* into `collection/doc_id`.
    Returns True on success, False if Firestore is unavailable.
    """
    client = _get_client()
    if not client or not _firestore_available:
        return False
    try:
        doc_ref = client.collection(collection).document(doc_id)
        await doc_ref.set(data, merge=True)
        return True
    except Exception as exc:
        logger.error("Firestore write_state failed: %s", exc)
        return False


async def read_state(collection: str, doc_id: str) -> dict | None:
    """
    Read a document from Firestore.
    Returns the document dict or None on failure / unavailability.
    """
    client = _get_client()
    if not client or not _firestore_available:
        return None
    try:
        doc_ref = client.collection(collection).document(doc_id)
        snapshot = await doc_ref.get()
        return snapshot.to_dict() if snapshot.exists else None
    except Exception as exc:
        logger.error("Firestore read_state failed: %s", exc)
        return None


async def append_ledger_entry(entry: dict) -> bool:
    """
    Append an agent ledger entry to the `agent-ledger` collection.
    Uses a Firestore auto-ID document so all entries are preserved.
    Returns True on success.
    """
    client = _get_client()
    if not client or not _firestore_available:
        return False
    try:
        collection_ref = client.collection("agent-ledger")
        await collection_ref.add(entry)
        return True
    except Exception as exc:
        logger.error("Firestore append_ledger_entry failed: %s", exc)
        return False


def is_available() -> bool:
    """Return True if Firestore is reachable."""
    _get_client()  # lazy init
    return _firestore_available
