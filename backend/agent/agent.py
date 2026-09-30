"""
REUNIFY Investigation Agent
Executes the explicit agent loop:
PLAN → ACT → OBSERVE → VERIFY → REFLECT → REPLAN
Coordinates Planner, Allowlisted Tool Dispatcher, Deterministic Scoring, and Contradiction Detection.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from .planner import GeminiProvider
from .reflection import check_reflection_needed
from ..tools.dispatcher import dispatch_tool
from ..verification.scoring import calculate_match_score
from ..verification.contradiction import evaluate_contradiction
from ..database import supabase as db


class InvestigationAgent:
    def __init__(self):
        self.planner = GeminiProvider()

    def run_investigation_cycle(self, case_id: str) -> Dict[str, Any]:
        """
        Executes an investigation cycle through the agent loop:
        PLAN → ACT → OBSERVE → VERIFY → REFLECT → REPLAN
        """
        case_data = db.get_case(case_id)
        if not case_data:
            raise ValueError(f"Case '{case_id}' not found.")

        # Update case status if fresh
        if case_data.get("status") == "submitted":
            db.update_case(case_id, {"status": "under_investigation"})
            db.add_audit_log(
                case_id=case_id,
                actor="InvestigationAgent",
                event_type="investigation_started",
                details={"case_number": case_data.get("case_number")},
            )

        previous_steps = db.get_investigation_steps(case_id)
        current_candidates = db.get_candidates(case_id)

        # Check existing contradictions across candidates
        all_contradictions: List[Dict[str, Any]] = []
        for c in current_candidates:
            if c.get("contradictions"):
                all_contradictions.extend(c["contradictions"])

        step_order = len(previous_steps) + 1
        steps_executed: List[Dict[str, Any]] = []

        # 1. PLAN
        plan_result = self.planner.plan(
            case_data=case_data,
            previous_steps=previous_steps,
            current_candidates=current_candidates,
            contradictions=all_contradictions,
        )
        plan = plan_result["plan"]
        provider = plan_result["provider"]

        action = plan["action"]
        params = plan.get("parameters", {})
        reason = plan["reason"]

        plan_step = db.add_investigation_step(
            case_id=case_id,
            step_data={
                "step_order": step_order,
                "phase": "PLAN",
                "action": action,
                "tool": action,
                "parameters": params,
                "reason": reason,
                "provider": provider,
            },
        )
        steps_executed.append(plan_step)
        db.add_audit_log(
            case_id=case_id,
            actor=f"AgentPlanner ({provider})",
            event_type="plan_generated",
            details={"action": action, "parameters": params, "reason": reason},
        )

        if action in ("review_candidate", "finish_investigation"):
            db.update_case(case_id, {"status": "awaiting_review"})
            db.add_audit_log(
                case_id=case_id,
                actor="InvestigationAgent",
                event_type="human_review_requested",
                details={"case_id": case_id},
            )
            return {
                "case_id": case_id,
                "status": "awaiting_review",
                "provider": provider,
                "steps": steps_executed,
                "candidates": db.get_candidates(case_id),
            }

        # 2. ACT
        step_order += 1
        tool_result = dispatch_tool(action, params)

        act_step = db.add_investigation_step(
            case_id=case_id,
            step_data={
                "step_order": step_order,
                "phase": "ACT",
                "action": f"Executed tool: {action}",
                "tool": action,
                "parameters": params,
            },
        )
        steps_executed.append(act_step)
        db.add_audit_log(
            case_id=case_id,
            actor="ToolDispatcher",
            event_type="tool_called",
            details={"tool": action, "parameters": params},
        )

        # 3. OBSERVE
        step_order += 1
        records_found = tool_result.get("records", [])
        observation_text = f"Retrieved {len(records_found)} records from {action}."

        observe_step = db.add_investigation_step(
            case_id=case_id,
            step_data={
                "step_order": step_order,
                "phase": "OBSERVE",
                "action": "Record Observation",
                "observation": observation_text,
                "records_count": len(records_found),
            },
        )
        steps_executed.append(observe_step)
        db.add_audit_log(
            case_id=case_id,
            actor="InvestigationAgent",
            event_type="tool_result",
            details={"tool": action, "records_count": len(records_found)},
        )

        # 4. VERIFY (Deterministic Python scoring & Contradiction detection)
        step_order += 1
        new_contradictions: List[Dict[str, Any]] = []

        # Retrieve all currently known source records across facilities to test pairwise feasibility
        all_known_records = db.get_source_records()

        for rec in records_found:
            # Pairwise contradiction check against other records
            rec_contradictions = []
            for other_rec in all_known_records:
                contra = evaluate_contradiction(rec, other_rec)
                if contra:
                    rec_contradictions.append(contra)
                    new_contradictions.append(contra)
                    db.add_audit_log(
                        case_id=case_id,
                        actor="ContradictionEngine",
                        event_type="contradiction_detected",
                        details={
                            "candidate": rec.get("external_id"),
                            "speed_kmh": contra["required_speed_kmh"],
                            "hypotheses": contra.get("possible_explanations") or contra.get("hypotheses", []),
                        },
                    )

            has_contra = len(rec_contradictions) > 0
            score_res = calculate_match_score(
                case_data=case_data,
                record_data=rec,
                has_contradiction=has_contra,
            )

            # Upsert candidate in database
            cand_code = rec.get("external_id") or rec.get("id")
            cand_record = {
                "case_id": case_id,
                "candidate_code": cand_code,
                "source_type": rec.get("source_type"),
                "source_name": rec.get("source_name") or rec.get("location_name"),
                "match_score": score_res["match_score"],
                "score_breakdown": score_res["score_breakdown"],
                "has_contradictions": has_contra,
                "contradictions": rec_contradictions if has_contra else None,
                "status": "under_review" if has_contra else "investigating",
                "source_record": rec,
            }
            db.upsert_candidate(cand_record)
            db.add_audit_log(
                case_id=case_id,
                actor="DeterministicVerificationEngine",
                event_type="score_updated",
                details={
                    "candidate_code": cand_code,
                    "score": score_res["match_score"],
                    "breakdown": score_res["score_breakdown"],
                },
            )

        verify_step = db.add_investigation_step(
            case_id=case_id,
            step_data={
                "step_order": step_order,
                "phase": "VERIFY",
                "action": "Deterministic Verification & Scoring",
                "observation": f"Scored {len(records_found)} candidates. Flagged {len(new_contradictions)} contradictions.",
            },
        )
        steps_executed.append(verify_step)

        # 5. REFLECT
        reflection_info = check_reflection_needed(
            contradictions=new_contradictions,
            tool_empty=(len(records_found) == 0),
        )

        if reflection_info:
            step_order += 1
            reflect_step = db.add_investigation_step(
                case_id=case_id,
                step_data={
                    "step_order": step_order,
                    "phase": "REFLECT",
                    "action": "Agent Reflection",
                    "reflection": reflection_info["reason"],
                    "trigger_type": reflection_info["trigger_type"],
                },
            )
            steps_executed.append(reflect_step)
            db.add_audit_log(
                case_id=case_id,
                actor="InvestigationAgent",
                event_type="reflection_triggered",
                details={"reason": reflection_info["reason"]},
            )

            # 6. REPLAN
            step_order += 1
            replan_action = reflection_info["suggested_next_action"]
            replan_step = db.add_investigation_step(
                case_id=case_id,
                step_data={
                    "step_order": step_order,
                    "phase": "REPLAN",
                    "action": f"Re-plan: Branching to {replan_action}",
                    "suggested_action": replan_action,
                },
            )
            steps_executed.append(replan_step)
            db.add_audit_log(
                case_id=case_id,
                actor="InvestigationAgent",
                event_type="replan_generated",
                details={"suggested_action": replan_action},
            )

        return {
            "case_id": case_id,
            "status": "in_progress",
            "provider": provider,
            "steps": steps_executed,
            "candidates": db.get_candidates(case_id),
        }
