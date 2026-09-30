"""
REUNIFY Audit Engine
Manages immutable audit logging for legal, supervisory, and forensic compliance.
"""

from typing import Dict, Any, List, Optional
from ..database import supabase as db


def record_audit_event(
    case_id: Optional[str],
    actor: str,
    event_type: str,
    details: Dict[str, Any],
) -> Dict[str, Any]:
    """Records an audit event in the database."""
    return db.add_audit_log(
        case_id=case_id,
        actor=actor,
        event_type=event_type,
        details=details,
    )


def fetch_audit_trail(case_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves immutable audit logs."""
    return db.get_audit_logs(case_id=case_id)
