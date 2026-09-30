"""
REUNIFY Supabase Database Layer
Interacts with Supabase PostgreSQL via REST/supabase-py client and transactional state engine.
Stores and updates:
- cases
- shelter_records
- hospital_records
- helpline_records
- candidates
- investigation_steps
- audit_logs
- pending_records / pending_injections
- review_decisions / human_decisions
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Load .env file from project root
load_dotenv()

logger = logging.getLogger("reunify.database")

# Environment & Persistence Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Operational Mode: 'supabase', 'local', or 'auto'
DATABASE_MODE = os.getenv("DATABASE_MODE", "auto").lower()

# In production (DATABASE_MODE="supabase"), local fallback is strictly prohibited.
# In development/testing, fallback can be explicitly enabled.
ALLOW_LOCAL_FALLBACK = os.getenv(
    "ALLOW_LOCAL_FALLBACK",
    "false" if DATABASE_MODE == "supabase" else "true"
).lower() in ("true", "1", "yes")

_supabase_client = None


class DatabaseError(Exception):
    """Custom exception raised when database operations fail."""
    pass


def get_utc_now() -> str:
    """Returns current UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()


def init_supabase_client():
    """Initializes the official Supabase Python client if credentials are configured."""
    global _supabase_client
    if SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY):
        try:
            import sys
            cwd = os.path.abspath(".")
            orig_sys_path = list(sys.path)
            try:
                sys.path = [p for p in sys.path if os.path.abspath(p) != cwd and p != "" and p != "."]
                from supabase import create_client
            finally:
                sys.path = orig_sys_path
            key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
            _supabase_client = create_client(SUPABASE_URL, key)
            logger.info("Supabase client successfully initialized.")
        except Exception as e:
            logger.warning(f"Failed to initialize Supabase client: {e}")
            _supabase_client = None
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Critical: Supabase client initialization failed in strict mode: {e}")
    else:
        _supabase_client = None
        if DATABASE_MODE == "supabase" and not ALLOW_LOCAL_FALLBACK:
            raise DatabaseError("Critical: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in supabase mode.")


def is_supabase_connected() -> bool:
    """Checks if a valid live Supabase connection is active."""
    return _supabase_client is not None


# Transactional relational state storage for local dev / test / fallback
_STATE: Dict[str, List[Dict[str, Any]]] = {
    "cases": [],
    "shelter_records": [],
    "hospital_records": [],
    "helpline_records": [],
    "candidates": [],
    "investigation_steps": [],
    "audit_logs": [],
    "pending_records": [],
    "review_decisions": [],
    "contradictions": [],
}

_INITIALIZED = False


def reset_demo_data():
    """Resets the database to its initial clean demo seed state in Supabase and local store."""
    global _INITIALIZED
    _STATE["cases"].clear()
    _STATE["shelter_records"].clear()
    _STATE["hospital_records"].clear()
    _STATE["helpline_records"].clear()
    _STATE["candidates"].clear()
    _STATE["investigation_steps"].clear()
    _STATE["audit_logs"].clear()
    _STATE["pending_records"].clear()
    _STATE["review_decisions"].clear()
    _STATE["contradictions"].clear()

    if _supabase_client:
        try:
            # Clean down test candidate/step/audit data for clean idempotent demo
            _supabase_client.table("human_decisions").delete().eq("case_id", "case-001").execute()
            _supabase_client.table("investigation_steps").delete().eq("case_id", "case-001").execute()
            _supabase_client.table("candidates").delete().eq("case_id", "case-001").execute()
            _supabase_client.table("audit_logs").delete().eq("case_id", "case-001").execute()
            
            # Remove any injected records (e.g., HP-099)
            _supabase_client.table("shelter_records").delete().neq("external_id", "SH-007").execute()
            _supabase_client.table("hospital_records").delete().neq("external_id", "HP-015").execute()
            _supabase_client.table("helpline_records").delete().neq("external_id", "HL-041").execute()
            
            # Remove any test non-seed cases and reset case-001
            _supabase_client.table("cases").delete().neq("id", "case-001").execute()
            _supabase_client.table("cases").update({"status": "submitted"}).eq("id", "case-001").execute()
        except Exception as e:
            logger.warning(f"Supabase reset cleanup warning: {e}")

    _INITIALIZED = False
    init_database()


def init_database():
    """Initializes and seeds the database with the required HACKSPRINT scenario data."""
    global _INITIALIZED
    if _INITIALIZED:
        return

    init_supabase_client()

    # Seed CASE-001 (Arun Kumar)
    case_arun = {
        "id": "case-001",
        "case_number": "CASE-2026-0842",
        "status": "submitted",
        "priority": "urgent",
        "full_name": "Arun Kumar",
        "alias": "Arun",
        "age": 22,
        "gender": "Male",
        "last_known_location": "Sellur Vaigai Bank, Madurai",
        "district": "Madurai",
        "last_seen_date": "2026-09-29",
        "last_seen_time": "19:30:00",
        "clothing_description": "Royal blue shirt, dark trousers",
        "distinguishing_marks": "Scar on left hand",
        "wristband_tag": None,
        "reporter_name": "Suresh Kumar",
        "reporter_relationship": "Elder Brother",
        "reporter_phone": "+91-98401-84729",
        "reporter_email": "suresh.k.madurai@gmail.com",
        "photo_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
        "data_origin": "synthetic",
        "created_at": "2026-09-29T19:45:00Z",
        "updated_at": "2026-09-29T19:45:00Z",
    }
    _STATE["cases"].append(case_arun)

    # Seed initial Shelter Records (SH-007)
    sh_rec = {
        "id": "rec-sh-007",
        "external_id": "SH-007",
        "source_type": "shelter",
        "source_name": "Sellur Government Relief Camp, Madurai",
        "person_name": None,
        "estimated_age": 23,
        "gender": "Male",
        "location_name": "Sellur Camp #4, Madurai",
        "district": "Madurai",
        "recorded_at": "2026-09-29T20:10:00Z",
        "clothing_summary": "Blue shirt, dark pants",
        "identifying_marks": None,
        "wristband_tag": "WB-1842",
        "status_condition": "Stable, intake complete",
        "data_origin": "synthetic",
        "created_at": "2026-09-29T20:10:00Z",
    }
    _STATE["shelter_records"].append(sh_rec)

    # Seed initial Hospital Records (HP-015)
    hp_rec = {
        "id": "rec-hp-015",
        "external_id": "HP-015",
        "source_type": "hospital",
        "source_name": "Government Rajaji Hospital (GRH), Madurai",
        "person_name": "Unknown Male",
        "estimated_age": 22,
        "gender": "Male",
        "location_name": "GRH Trauma Bay, Madurai",
        "district": "Madurai",
        "recorded_at": "2026-09-29T21:00:00Z",
        "clothing_summary": "Grey tee shirt",
        "identifying_marks": None,
        "wristband_tag": "GRH-9921",
        "status_condition": "Conscious, mild contusion",
        "data_origin": "synthetic",
        "created_at": "2026-09-29T21:00:00Z",
    }
    _STATE["hospital_records"].append(hp_rec)

    # Seed Helpline Records (HL-041)
    hl_rec = {
        "id": "rec-hl-041",
        "external_id": "HL-041",
        "source_type": "helpline",
        "source_name": "SDMA 1070 Disaster Helpline Madurai Desk",
        "person_name": "Reported youth",
        "estimated_age": 22,
        "gender": "Male",
        "location_name": "Vaigai North Bank near Sellur, Madurai",
        "district": "Madurai",
        "recorded_at": "2026-09-29T20:00:00Z",
        "clothing_summary": "blue shirt, left hand bandaged",
        "identifying_marks": "left hand bandaged",
        "wristband_tag": None,
        "status_condition": "Sighting reported walking towards Sellur Camp",
        "data_origin": "synthetic",
        "created_at": "2026-09-29T20:00:00Z",
    }
    _STATE["helpline_records"].append(hl_rec)

    # Pending injectable records:
    # 1. PEND-CONTRA: HP-099 Theni, 7:45 PM, WB-1842
    _STATE["pending_records"].append({
        "pending_id": "PEND-CONTRA",
        "record": {
            "id": "rec-hp-099",
            "external_id": "HP-099",
            "source_type": "hospital",
            "source_name": "Theni Government Medical College Hospital (TGMCH), Theni",
            "person_name": "Patient Tag WB-1842",
            "estimated_age": 28,
            "gender": "Male",
            "location_name": "TGMCH Bay 2, Theni",
            "district": "Theni",
            "recorded_at": "2026-09-29T19:45:00Z",
            "clothing_summary": "Green shirt, beige trousers",
            "identifying_marks": "Burn mark on right shoulder",
            "wristband_tag": "WB-1842",
            "status_condition": "Admitted with waterborne laceration",
            "data_origin": "synthetic",
            "created_at": "2026-09-29T19:45:00Z",
        },
        "description": "Theni Hospital admission with wristband WB-1842 at 7:45 PM (Triggers Spatiotemporal Contradiction)",
    })

    # 2. PEND-REFINE: HP-015 refined record: name "Arunn", scar on left hand, blue shirt
    _STATE["pending_records"].append({
        "pending_id": "PEND-REFINE",
        "target_record_id": "rec-hp-015",
        "updates": {
            "person_name": "Arunn",
            "clothing_summary": "Blue shirt, dark trousers",
            "identifying_marks": "Scar on left hand",
            "status_condition": "Awake, responding to brother's name",
        },
        "description": "GRH Madurai triage officer updates HP-015: Name identified as 'Arunn', scar on left hand confirmed",
    })

    if _supabase_client:
        try:
            _supabase_client.table("cases").upsert(case_arun).execute()
            _supabase_client.table("shelter_records").upsert(sh_rec).execute()
            _supabase_client.table("hospital_records").upsert(hp_rec).execute()
            _supabase_client.table("helpline_records").upsert(hl_rec).execute()
        except Exception as e:
            logger.error(f"Supabase init seeding error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to seed Supabase database: {e}")

    _INITIALIZED = True



# Initialize immediately upon module import
init_database()


# ====================================================================
# REPOSITORY / DATABASE FUNCTIONS
# ====================================================================

def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single case by UUID id or case_number."""
    if _supabase_client:
        try:
            res = _supabase_client.table("cases").select("*").or_(f"id.eq.{case_id},case_number.eq.{case_id}").limit(1).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.error(f"Supabase get_case error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to retrieve case from Supabase: {e}")

    for c in _STATE["cases"]:
        if c["id"] == case_id or c.get("case_number") == case_id:
            return dict(c)
    return None


def get_all_cases() -> List[Dict[str, Any]]:
    """Retrieves all cases."""
    if _supabase_client:
        try:
            res = _supabase_client.table("cases").select("*").order("created_at", desc=True).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error(f"Supabase get_all_cases error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to list cases from Supabase: {e}")

    return list(_STATE["cases"])


def create_case(case_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Creates and persists a new missing person case."""
    import uuid
    now = get_utc_now()
    new_id = case_dict.get("id") or f"case-{uuid.uuid4().hex[:6]}"
    case_num = case_dict.get("case_number") or f"CASE-2026-{uuid.uuid4().hex[:4].upper()}"
    record = {
        **case_dict,
        "id": new_id,
        "case_number": case_num,
        "status": case_dict.get("status", "submitted"),
        "created_at": now,
        "updated_at": now,
    }

    if _supabase_client:
        try:
            _supabase_client.table("cases").insert(record).execute()
        except Exception as e:
            logger.error(f"Supabase create_case error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to create case in Supabase: {e}")

    _STATE["cases"].insert(0, record)
    return record


def update_case(case_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Updates case fields by id or case_number."""
    now = get_utc_now()
    updates_with_time = {**updates, "updated_at": now}

    if _supabase_client:
        try:
            _supabase_client.table("cases").update(updates_with_time).or_(f"id.eq.{case_id},case_number.eq.{case_id}").execute()
        except Exception as e:
            logger.error(f"Supabase update_case error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to update case in Supabase: {e}")

    for c in _STATE["cases"]:
        if c["id"] == case_id or c.get("case_number") == case_id:
            c.update(updates_with_time)
            return c
    return None


def get_source_records(source_type: Optional[str] = None, district: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves records across shelter, hospital, and helpline sources."""
    records: List[Dict[str, Any]] = []

    if _supabase_client:
        try:
            tables = []
            if not source_type or source_type == "shelter":
                tables.append("shelter_records")
            if not source_type or source_type == "hospital":
                tables.append("hospital_records")
            if not source_type or source_type == "helpline":
                tables.append("helpline_records")

            for tbl in tables:
                query = _supabase_client.table(tbl).select("*")
                if district:
                    query = query.ilike("district", district.strip())
                res = query.execute()
                if res.data:
                    records.extend(res.data)
            if records:
                return records
        except Exception as e:
            logger.error(f"Supabase get_source_records error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to query source records from Supabase: {e}")

    if not source_type or source_type == "shelter":
        records.extend(_STATE["shelter_records"])
    if not source_type or source_type == "hospital":
        records.extend(_STATE["hospital_records"])
    if not source_type or source_type == "helpline":
        records.extend(_STATE["helpline_records"])

    if district:
        d_lower = district.strip().lower()
        records = [r for r in records if (r.get("district") or "").strip().lower() == d_lower]

    return records


def add_source_record(source_type: str, record: Dict[str, Any]) -> Dict[str, Any]:
    """Adds a new source record to the corresponding source table."""
    now = get_utc_now()
    record["created_at"] = record.get("created_at") or now

    if _supabase_client:
        try:
            tbl = f"{source_type}_records"
            _supabase_client.table(tbl).upsert(record).execute()
        except Exception as e:
            logger.error(f"Supabase add_source_record error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to add source record to Supabase: {e}")

    if source_type == "shelter":
        _STATE["shelter_records"].append(record)
    elif source_type == "hospital":
        _STATE["hospital_records"].append(record)
    elif source_type == "helpline":
        _STATE["helpline_records"].append(record)
    return record


def get_candidates(case_id: str) -> List[Dict[str, Any]]:
    """Retrieves ranked candidate matches for a given case."""
    if _supabase_client:
        try:
            res = _supabase_client.table("candidates").select("*").eq("case_id", case_id).order("match_score", desc=True).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error(f"Supabase get_candidates error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to fetch candidates from Supabase: {e}")

    return [c for c in _STATE["candidates"] if c.get("case_id") == case_id]


def upsert_candidate(candidate_data: Dict[str, Any]) -> Dict[str, Any]:
    """Inserts or updates a candidate record in Supabase and local store."""
    now = get_utc_now()
    
    # 1. Resolve existing ID if updating by candidate_code
    existing_id = candidate_data.get("id")
    if not existing_id:
        for c in _STATE["candidates"]:
            if (
                c.get("case_id") == candidate_data.get("case_id")
                and c.get("candidate_code") == candidate_data.get("candidate_code")
            ):
                existing_id = c.get("id")
                break

    if not existing_id and _supabase_client:
        try:
            res = (
                _supabase_client.table("candidates")
                .select("id")
                .eq("case_id", candidate_data.get("case_id"))
                .eq("candidate_code", candidate_data.get("candidate_code"))
                .limit(1)
                .execute()
            )
            if res.data:
                existing_id = res.data[0]["id"]
        except Exception:
            pass

    cand_id = existing_id or f"cand-{len(_STATE['candidates']) + 1:03d}"

    db_payload = {
        "id": cand_id,
        "case_id": candidate_data.get("case_id"),
        "source_record_id": candidate_data.get("source_record_id"),
        "candidate_code": candidate_data.get("candidate_code", "UNKNOWN"),
        "source_type": candidate_data.get("source_type", "shelter"),
        "source_name": candidate_data.get("source_name", "Unknown Source"),
        "match_score": candidate_data.get("match_score", 0.0),
        "score_breakdown": candidate_data.get("score_breakdown", {}),
        "has_contradictions": bool(candidate_data.get("has_contradictions", False)),
        "contradictions_count": candidate_data.get("contradictions_count", 0),
        "contradiction_details": candidate_data.get("contradiction_details", {}),
        "status": candidate_data.get("status", "new"),
        "data_origin": candidate_data.get("data_origin", "synthetic"),
        "updated_at": now,
    }

    if _supabase_client:
        try:
            _supabase_client.table("candidates").upsert(db_payload).execute()
        except Exception as e:
            logger.error(f"Supabase upsert_candidate error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to upsert candidate in Supabase: {e}")

    for idx, c in enumerate(_STATE["candidates"]):
        if (c.get("id") == cand_id) or (
            c.get("case_id") == candidate_data.get("case_id")
            and c.get("candidate_code") == candidate_data.get("candidate_code")
        ):
            _STATE["candidates"][idx].update(candidate_data)
            _STATE["candidates"][idx]["updated_at"] = now
            return _STATE["candidates"][idx]

    new_cand = {
        **candidate_data,
        "id": cand_id,
        "created_at": now,
        "updated_at": now,
    }
    _STATE["candidates"].append(new_cand)
    return new_cand


def add_investigation_step(case_id: str, step_data: Dict[str, Any]) -> Dict[str, Any]:
    """Records an agent cycle execution step in Supabase and local store."""
    now = get_utc_now()
    step = {
        **step_data,
        "case_id": case_id,
        "timestamp": now,
        "created_at": now,
    }

    db_payload = {
        "case_id": case_id,
        "step_order": step_data.get("step_order", 1),
        "cycle_number": step_data.get("cycle_number", 1),
        "phase": step_data.get("phase", "INVESTIGATE"),
        "action_name": step_data.get("action_name") or step_data.get("action") or "unspecified",
        "tool_name": step_data.get("tool_name") or step_data.get("tool"),
        "tool_input": step_data.get("tool_input") or step_data.get("parameters") or {},
        "tool_output": step_data.get("tool_output") or step_data.get("result") or {},
        "reasoning": step_data.get("reasoning") or step_data.get("reason"),
        "reflection_notes": json.dumps(step_data.get("reflection_notes")) if isinstance(step_data.get("reflection_notes"), (dict, list)) else step_data.get("reflection_notes"),
        "timestamp": now,
        "created_at": now,
    }

    if _supabase_client:
        try:
            _supabase_client.table("investigation_steps").insert(db_payload).execute()
        except Exception as e:
            logger.error(f"Supabase add_investigation_step error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to add investigation step to Supabase: {e}")

    _STATE["investigation_steps"].append(step)
    return step


def get_investigation_steps(case_id: str) -> List[Dict[str, Any]]:
    """Retrieves all investigation steps for a case."""
    if _supabase_client:
        try:
            res = _supabase_client.table("investigation_steps").select("*").eq("case_id", case_id).order("created_at").execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error(f"Supabase get_investigation_steps error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to fetch investigation steps from Supabase: {e}")

    return [s for s in _STATE["investigation_steps"] if s.get("case_id") == case_id]


def add_audit_log(case_id: Optional[str], actor: str, event_type: str, details: Dict[str, Any]) -> Dict[str, Any]:
    """Records an immutable audit event in Supabase and local store."""
    now = get_utc_now()
    log = {
        "id": f"audit-{len(_STATE['audit_logs']) + 1:04d}",
        "case_id": case_id,
        "timestamp": now,
        "created_at": now,
        "actor": actor,
        "actor_name": actor,
        "event_type": event_type,
        "details": details,
        "payload": details,
    }

    db_payload = {
        "case_id": case_id,
        "phase": details.get("phase", "AUDIT"),
        "actor": actor,
        "actor_name": actor,
        "event_type": event_type,
        "entity_type": details.get("entity_type", "case"),
        "entity_id": details.get("entity_id", case_id),
        "details": details,
        "payload": details,
        "timestamp": now,
        "created_at": now,
    }

    if _supabase_client:
        try:
            _supabase_client.table("audit_logs").insert(db_payload).execute()
        except Exception as e:
            logger.error(f"Supabase add_audit_log error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to record audit log in Supabase: {e}")

    _STATE["audit_logs"].append(log)
    return log


def get_audit_logs(case_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves audit logs, optionally filtered by case_id."""
    if _supabase_client:
        try:
            query = _supabase_client.table("audit_logs").select("*").order("created_at")
            if case_id:
                query = query.eq("case_id", case_id)
            res = query.execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error(f"Supabase get_audit_logs error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to fetch audit logs from Supabase: {e}")

    if case_id:
        return [l for l in _STATE["audit_logs"] if l.get("case_id") == case_id]
    return list(_STATE["audit_logs"])


def get_pending_injection(pending_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a pending simulation injection by ID."""
    for p in _STATE["pending_records"]:
        if p["pending_id"] == pending_id:
            return p
    return None


def save_human_decision(case_id: str, candidate_id: str, decision_data: Dict[str, Any]) -> Dict[str, Any]:
    """Persists a human reviewer decision in Supabase and local store."""
    now = get_utc_now()
    record = {
        **decision_data,
        "case_id": case_id,
        "candidate_id": candidate_id,
        "created_at": now,
    }

    db_payload = {
        "case_id": case_id,
        "candidate_id": candidate_id,
        "reviewer_name": decision_data.get("reviewer_name", "Investigator"),
        "action": decision_data.get("action", "approve"),
        "confidence_level": decision_data.get("confidence_level", "high"),
        "rationale": decision_data.get("rationale", ""),
        "required_followup": decision_data.get("required_followup"),
        "created_at": now,
    }

    if _supabase_client:
        try:
            _supabase_client.table("human_decisions").insert(db_payload).execute()
        except Exception as e:
            logger.error(f"Supabase save_human_decision error: {e}")
            if not ALLOW_LOCAL_FALLBACK:
                raise DatabaseError(f"Failed to persist human review decision in Supabase: {e}")

    _STATE["review_decisions"].append(record)
    return record
