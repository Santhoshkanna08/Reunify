import os
from dotenv import load_dotenv

# Load .env file from project root
load_dotenv()
"""
REUNIFY FastAPI Backend Server
Provides REST endpoints for investigation agent, deterministic verification,
evidence injection, candidate ranking, and supervisory human review.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional

from .schemas.cases import CaseCreateSchema, CaseResponseSchema
from .schemas.candidates import DecisionRequestSchema, CandidateResponseSchema
from .database import supabase as db
from .agent.agent import InvestigationAgent
from .verification.scoring import calculate_match_score
from .verification.contradiction import evaluate_contradiction
from .audit.audit import record_audit_event, fetch_audit_trail

app = FastAPI(
    title="REUNIFY API",
    description="Missing Persons & Evidence Reconciliation System (HACKSPRINT DM-05)",
    version="1.0.0",
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = InvestigationAgent()


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "REUNIFY FastAPI",
        "principle": "The LLM reasons. The system verifies. The human decides.",
    }


# --- CASES ---

@app.get("/cases", response_model=List[CaseResponseSchema])
def list_cases():
    return db.get_all_cases()


@app.post("/cases", response_model=CaseResponseSchema, status_code=status.HTTP_201_CREATED)
def create_case(case_input: CaseCreateSchema):
    new_case = db.create_case(case_input.model_dump())
    record_audit_event(
        case_id=new_case["id"],
        actor=new_case.get("reporter_name", "Reporter"),
        event_type="case_created",
        details={"case_number": new_case["case_number"], "full_name": new_case["full_name"]},
    )
    return new_case


@app.get("/cases/{case_id}", response_model=CaseResponseSchema)
def get_case_detail(case_id: str):
    case_data = db.get_case(case_id)
    if not case_data:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
    return case_data


# --- INVESTIGATION AGENT ---

@app.post("/cases/{case_id}/investigate")
def run_investigation(case_id: str):
    """
    Executes an investigation cycle through the agent loop:
    PLAN → ACT → OBSERVE → VERIFY → REFLECT → REPLAN
    """
    case_data = db.get_case(case_id)
    if not case_data:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    MAX_AGENT_CYCLES = 8
    cycles_run = 0
    result = None

    while cycles_run < MAX_AGENT_CYCLES:
        result = agent.run_investigation_cycle(case_id)
        cycles_run += 1
        if result.get("status") == "awaiting_review":
            break
            
    if result and result.get("status") != "awaiting_review":
        db.update_case(case_id, {"status": "awaiting_review"})
        db.add_audit_log(
            case_id=case_id,
            actor="InvestigationAgent",
            event_type="max_cycles_reached",
            details={"message": f"Reached MAX_AGENT_CYCLES ({MAX_AGENT_CYCLES}). Forcing human review."}
        )
        result["status"] = "awaiting_review"

    return result


@app.get("/cases/{case_id}/steps")
def get_steps(case_id: str):
    return db.get_investigation_steps(case_id)


# --- CANDIDATES & EVIDENCE ---

@app.get("/cases/{case_id}/candidates")
def get_candidates(case_id: str):
    cands = db.get_candidates(case_id)
    # Sort descending by match_score
    return sorted(cands, key=lambda c: c.get("match_score", 0), reverse=True)


# --- EVIDENCE INJECTION (DEMO CONTRA & REFINE) ---

@app.post("/cases/{case_id}/inject/{pending_id}")
def inject_pending_record(case_id: str, pending_id: str):
    """
    Injects pending record into active disaster intake:
    1. PEND-CONTRA: Injects HP-099 Theni (7:45 PM, WB-1842) causing a spatiotemporal contradiction.
    2. PEND-REFINE: Updates HP-015 in Madurai with refined name ('Arunn'), scars, and blue shirt.
    """
    case_data = db.get_case(case_id)
    if not case_data:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    injection = db.get_pending_injection(pending_id)
    if not injection:
        raise HTTPException(status_code=404, detail=f"Pending injection '{pending_id}' not found.")

    # 1. PEND-CONTRA: Add HP-099 record
    if pending_id == "PEND-CONTRA":
        rec = injection["record"]
        db.add_source_record("hospital", rec)

        record_audit_event(
            case_id=case_id,
            actor="DisasterIntake",
            event_type="record_injected",
            details={
                "pending_id": pending_id,
                "record_id": rec["external_id"],
                "description": injection["description"],
            },
        )

        # Pairwise contradiction check against SH-007
        all_records = db.get_source_records()
        contra_detected = False
        for r in all_records:
            contra = evaluate_contradiction(rec, r)
            if contra:
                contra_detected = True
                record_audit_event(
                    case_id=case_id,
                    actor="ContradictionEngine",
                    event_type="contradiction_detected",
                    details={
                        "records": [rec["external_id"], r["external_id"]],
                        "speed_kmh": contra["required_speed_kmh"],
                        "hypotheses": contra["possible_explanations"],
                    },
                )

                # Re-score SH-007 with contradiction penalty (-25)
                # SH-007 was initial 50 -> now 25
                score_res = calculate_match_score(case_data, r, has_contradiction=True)
                db.upsert_candidate({
                    "case_id": case_id,
                    "candidate_code": r["external_id"],
                    "source_type": r["source_type"],
                    "source_name": r["source_name"],
                    "match_score": score_res["match_score"],
                    "score_breakdown": score_res["score_breakdown"],
                    "has_contradictions": True,
                    "contradictions": [contra],
                    "status": "under_review",
                    "source_record": r,
                })
                record_audit_event(
                    case_id=case_id,
                    actor="DeterministicVerificationEngine",
                    event_type="score_updated",
                    details={
                        "candidate_code": r["external_id"],
                        "new_score": score_res["match_score"],
                        "penalty": -25,
                    },
                )

        # Also register HP-099 as candidate with contradiction
        score_hp099 = calculate_match_score(case_data, rec, has_contradiction=True)
        db.upsert_candidate({
            "case_id": case_id,
            "candidate_code": rec["external_id"],
            "source_type": rec["source_type"],
            "source_name": rec["source_name"],
            "match_score": score_hp099["match_score"],
            "score_breakdown": score_hp099["score_breakdown"],
            "has_contradictions": True,
            "status": "under_review",
            "source_record": rec,
        })

        return {
            "status": "injected",
            "pending_id": pending_id,
            "contradiction_detected": contra_detected,
            "candidates": db.get_candidates(case_id),
        }

    # 2. PEND-REFINE: Update HP-015
    if pending_id == "PEND-REFINE":
        target_id = injection["target_record_id"]
        updates = injection["updates"]

        # Find target in hospital records
        updated_rec = None
        for r in db.get_source_records(source_type="hospital"):
            if r.get("id") == target_id or r.get("external_id") == "HP-015":
                r.update(updates)
                updated_rec = r
                break

        if not updated_rec:
            raise HTTPException(status_code=404, detail="Target record HP-015 not found.")

        record_audit_event(
            case_id=case_id,
            actor="HospitalTriageOfficer",
            event_type="record_injected",
            details={
                "pending_id": pending_id,
                "record_id": "HP-015",
                "updates": updates,
            },
        )

        # Recalculate deterministic score for HP-015
        # Expected: ~83 points (Age +15, District +15, Time +10, Clothes +10, Marks +15, Name Arunn +18)
        score_res = calculate_match_score(case_data, updated_rec, has_contradiction=False)
        updated_cand = db.upsert_candidate({
            "case_id": case_id,
            "candidate_code": "HP-015",
            "source_type": updated_rec["source_type"],
            "source_name": updated_rec["source_name"],
            "match_score": score_res["match_score"],
            "score_breakdown": score_res["score_breakdown"],
            "has_contradictions": False,
            "status": "under_review",
            "source_record": updated_rec,
        })

        record_audit_event(
            case_id=case_id,
            actor="DeterministicVerificationEngine",
            event_type="score_updated",
            details={
                "candidate_code": "HP-015",
                "new_score": score_res["match_score"],
                "breakdown": score_res["score_breakdown"],
            },
        )

        return {
            "status": "refined",
            "pending_id": pending_id,
            "candidate": updated_cand,
            "candidates": db.get_candidates(case_id),
        }

    raise HTTPException(status_code=400, detail="Unknown injection ID.")


# --- AUDIT TRAIL ---

@app.get("/cases/{case_id}/audit")
def get_case_audit(case_id: str):
    return fetch_audit_trail(case_id=case_id)


# --- SUPERVISORY HUMAN REVIEW ---

@app.post("/candidates/{candidate_id}/decision")
def submit_human_decision(candidate_id: str, decision: DecisionRequestSchema):
    """
    Submits certified human decision for a candidate:
    Actions: 'approve', 'reject', 'further_review'
    Enforces 'The Human Decides' principle and commits to immutable audit trail.
    """
    all_candidates = []
    found_cand = None
    target_case_id = None

    for c in db.get_all_cases():
        cands = db.get_candidates(c["id"])
        for cand in cands:
            if cand["id"] == candidate_id or cand["candidate_code"] == candidate_id:
                found_cand = cand
                target_case_id = c["id"]
                break
        if found_cand:
            break

    if not found_cand:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found.")

    action_norm = decision.action.lower()
    if action_norm not in ("approve", "reject", "further_review"):
        raise HTTPException(status_code=400, detail=f"Invalid action '{decision.action}'. Must be approve, reject, or further_review.")

    # Status mapping
    status_map = {
        "approve": "approved",
        "reject": "rejected",
        "further_review": "investigating",
    }
    new_cand_status = status_map[action_norm]
    found_cand["status"] = new_cand_status

    if action_norm == "approve":
        db.update_case(target_case_id, {"status": "reunited"})

    record_audit_event(
        case_id=target_case_id,
        actor=decision.reviewer_name,
        event_type="human_decision",
        details={
            "candidate_code": found_cand["candidate_code"],
            "action": action_norm,
            "confidence_level": decision.confidence_level,
            "rationale": decision.rationale,
        },
    )

    return {
        "status": "success",
        "action": action_norm,
        "candidate": found_cand,
        "message": f"Human review decision '{action_norm}' successfully committed.",
    }

@app.post("/dev/reset")
def reset_demo():
    db.reset_demo_data()
    return {"status": "reset complete"}
