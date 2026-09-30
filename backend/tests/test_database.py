"""
REUNIFY Database Layer Integration Tests
Tests database repository operations:
- create case → retrieve case
- create source record → retrieve source record
- create candidate → retrieve candidate
- create investigation step → retrieve step
- create human decision → retrieve decision
- create audit log → retrieve audit log
- reset demo → verify clean state
"""

import pytest
from backend.database import supabase as db


def test_db_case_lifecycle():
    # 1. Create case
    case_payload = {
        "full_name": "Integration Test Subject",
        "alias": "Subject A",
        "age": 25,
        "gender": "Female",
        "district": "Madurai",
        "last_known_location": "Simmakkal Ground",
        "last_seen_date": "2026-09-30",
        "clothing_description": "Red dress",
        "reporter_name": "Family Member",
        "reporter_relationship": "Mother",
        "reporter_phone": "+91-90000-11111",
    }
    created = db.create_case(case_payload)
    assert created["id"].startswith("case-")
    assert created["full_name"] == "Integration Test Subject"

    # 2. Retrieve case by id
    fetched = db.get_case(created["id"])
    assert fetched is not None
    assert fetched["case_number"] == created["case_number"]

    # 3. Retrieve case by case_number
    fetched_by_num = db.get_case(created["case_number"])
    assert fetched_by_num is not None
    assert fetched_by_num["id"] == created["id"]

    # 4. Update case
    updated = db.update_case(created["id"], {"status": "under_investigation"})
    assert updated["status"] == "under_investigation"
    assert db.get_case(created["id"])["status"] == "under_investigation"


def test_db_source_records():
    record_payload = {
        "id": "rec-sh-test",
        "external_id": "SH-999",
        "source_type": "shelter",
        "source_name": "Emergency Test Relief Shelter",
        "person_name": "Subject A",
        "estimated_age": 25,
        "district": "Madurai",
        "location_name": "Camp Sector 1",
        "recorded_at": "2026-09-30T21:00:00Z",
    }
    added = db.add_source_record("shelter", record_payload)
    assert added["external_id"] == "SH-999"

    records = db.get_source_records(source_type="shelter", district="Madurai")
    assert any(r["external_id"] == "SH-999" for r in records)


def test_db_candidate_lifecycle():
    cand_data = {
        "case_id": "case-001",
        "candidate_code": "TEST-CAND-01",
        "source_type": "shelter",
        "source_name": "Test Shelter",
        "match_score": 75.0,
        "score_breakdown": {"age_compat": 15, "location": 15, "clothing": 10},
        "has_contradictions": False,
        "status": "new",
    }
    cand = db.upsert_candidate(cand_data)
    assert cand["candidate_code"] == "TEST-CAND-01"

    cands = db.get_candidates("case-001")
    assert any(c["candidate_code"] == "TEST-CAND-01" for c in cands)

    # Update candidate score
    cand_data_updated = {**cand_data, "match_score": 85.0}
    cand_updated = db.upsert_candidate(cand_data_updated)
    assert cand_updated["match_score"] == 85.0


def test_db_investigation_steps():
    step_data = {
        "step_order": 1,
        "phase": "plan",
        "action_name": "search_shelters",
        "tool_name": "search_shelters",
        "reasoning": "Searching local relief camps in Madurai",
    }
    step = db.add_investigation_step("case-001", step_data)
    assert step["action_name"] == "search_shelters"

    steps = db.get_investigation_steps("case-001")
    assert len(steps) >= 1
    assert any((s.get("action_name") == "search_shelters" or s.get("action") == "search_shelters") for s in steps)


def test_db_audit_logs():
    log = db.add_audit_log(
        case_id="case-001",
        actor="Investigator",
        event_type="test_event",
        details={"key": "value"},
    )
    assert log["event_type"] == "test_event"

    logs = db.get_audit_logs(case_id="case-001")
    assert any(l["event_type"] == "test_event" for l in logs)


def test_db_human_decision():
    decision_data = {
        "reviewer_name": "Supervisor Raman",
        "action": "approve",
        "confidence_level": "high",
        "rationale": "High confidence match verified with camp official",
    }
    saved = db.save_human_decision("case-001", "cand-001", decision_data)
    assert saved["action"] == "approve"


def test_db_reset_demo():
    # Call reset twice to verify no duplicates
    db.reset_demo_data()
    db.reset_demo_data()
    cases = db.get_all_cases()
    assert len(cases) == 1
    assert cases[0]["id"] == "case-001"
    assert cases[0]["full_name"] == "Arun Kumar"
    
    shelters = db.get_source_records(source_type="shelter")
    assert len(shelters) == 1
    assert shelters[0]["external_id"] == "SH-007"


def test_supabase_strict_failure_handling(monkeypatch):
    import backend.database.supabase as db_mod
    # In strict mode without fallback, an unhandled database error raises DatabaseError
    monkeypatch.setattr(db_mod, "ALLOW_LOCAL_FALLBACK", False)
    
    class BrokenClient:
        def table(self, name):
            raise RuntimeError("PostgREST connection refused")

    monkeypatch.setattr(db_mod, "_supabase_client", BrokenClient())
    
    with pytest.raises(db_mod.DatabaseError) as exc_info:
        db_mod.get_all_cases()
    assert "Failed to list cases from Supabase" in str(exc_info.value)
