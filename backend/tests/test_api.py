"""
REUNIFY FastAPI Endpoints Test Suite
Tests all required REST endpoints:
- POST /cases
- POST /cases/{case_id}/investigate
- POST /cases/{case_id}/inject/{pending_id}
- GET  /cases/{case_id}/candidates
- GET  /cases/{case_id}/audit
- POST /candidates/{candidate_id}/decision
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import supabase as db

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "LLM reasons" in data["principle"]


def test_list_and_create_case():
    res = client.get("/cases")
    assert res.status_code == 200
    cases = res.json()
    assert len(cases) >= 1
    assert any(c["id"] == "case-001" for c in cases)

    # Create new case
    new_case_payload = {
        "full_name": "Test Missing Person",
        "alias": "Tester",
        "age": 30,
        "gender": "Female",
        "district": "Madurai",
        "last_known_location": "Mattuthavani Bus Stand",
        "last_seen_date": "2026-09-30",
        "clothing_description": "Yellow saree",
        "reporter_name": "Test Relative",
        "reporter_relationship": "Sister",
        "reporter_phone": "+91-98765-43210",
    }
    create_res = client.post("/cases", json=new_case_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["full_name"] == "Test Missing Person"
    assert "id" in created
    assert "case_number" in created


def test_run_investigation():
    res = client.post("/cases/case-001/investigate")
    assert res.status_code == 200
    data = res.json()
    assert data["case_id"] == "case-001"
    assert "steps" in data
    assert len(data["steps"]) >= 1

    # Verify candidates were generated
    cand_res = client.get("/cases/case-001/candidates")
    assert cand_res.status_code == 200
    candidates = cand_res.json()
    assert len(candidates) >= 1


def test_inject_pending_contradiction():
    # Inject PEND-CONTRA
    res = client.post("/cases/case-001/inject/PEND-CONTRA")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "injected"
    assert data["contradiction_detected"] is True

    # Candidates should now have contradiction flagged
    cands = client.get("/cases/case-001/candidates").json()
    contra_cands = [c for c in cands if c.get("has_contradictions")]
    assert len(contra_cands) >= 1


def test_inject_pending_refine():
    # Inject PEND-REFINE
    res = client.post("/cases/case-001/inject/PEND-REFINE")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "refined"
    assert data["candidate"]["candidate_code"] == "HP-015"
    assert data["candidate"]["match_score"] == 83


def test_audit_trail():
    res = client.get("/cases/case-001/audit")
    assert res.status_code == 200
    audit_logs = res.json()
    assert isinstance(audit_logs, list)
    assert len(audit_logs) >= 1
    # Check for expected event types
    events = [log["event_type"] for log in audit_logs]
    assert any(e in events for e in ["case_created", "investigation_started", "score_updated", "record_injected"])


def test_human_decision_flow():
    # Submit decision for HP-015
    decision_payload = {
        "reviewer_name": "Chief Inspector Ramesh",
        "action": "approve",
        "confidence_level": "high",
        "rationale": "Identity verified with GRH triage officer, matching brother Suresh and scar confirmed.",
    }
    res = client.post("/candidates/HP-015/decision", json=decision_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["action"] == "approve"
    assert data["candidate"]["status"] == "approved"

    # Case should now be marked reunited
    case_detail = client.get("/cases/case-001").json()
    assert case_detail["status"] == "reunited"
