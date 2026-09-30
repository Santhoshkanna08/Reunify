"""
REUNIFY AI Planner & Provider Abstraction Layer
Implements GeminiProvider with strict JSON output & schema validation.
Provides DeterministicRulePlanner fallback when offline, rate-limited, or unconfigured.
"""

import os
import json
import logging
import httpx
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from ..schemas.agent import AgentPlanSchema, ALLOWLISTED_ACTIONS

logger = logging.getLogger("reunify.planner")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

class AIProvider(ABC):
    @abstractmethod
    def plan(
        self,
        case_data: Dict[str, Any],
        previous_steps: List[Dict[str, Any]],
        current_candidates: List[Dict[str, Any]],
        contradictions: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Returns validated plan dictionary with 'plan' and 'provider'."""
        pass


class DeterministicRulePlanner(AIProvider):
    """
    Deterministic rule-based investigation planner.
    Guarantees reliable execution under network failure or API exhaustion.
    """
    def plan(
        self,
        case_data: Dict[str, Any],
        previous_steps: List[Dict[str, Any]],
        current_candidates: List[Dict[str, Any]],
        contradictions: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        district = case_data.get("district", "Madurai")
        actions_taken = [s.get("tool") or s.get("action") for s in previous_steps if s.get("phase") in ("PLAN", "ACT")]

        # Case 1: Contradiction detected -> Reflect and check secondary records
        if contradictions:
            return {
                "provider": "deterministic_fallback",
                "plan": AgentPlanSchema(
                    action="search_helpline",
                    parameters={"district": district},
                    reason="Spatiotemporal contradiction detected on wristband tag. Cross-referencing 1070 helpline sighting reports for independent verification.",
                    continue_investigation=True,
                    reflection="Contradiction observed between distant facilities. Investigating secondary sighting logs to resolve ambiguity.",
                ).model_dump(),
            }

        # Step 1: Shelter search
        if "search_shelter" not in actions_taken:
            return {
                "provider": "deterministic_fallback",
                "plan": AgentPlanSchema(
                    action="search_shelter",
                    parameters={"district": district},
                    reason=f"Priority 1 is searching disaster relief shelters in {district} for matching physical and clothing tokens.",
                    continue_investigation=True,
                ).model_dump(),
            }

        # Step 2: Hospital search
        if "search_hospital" not in actions_taken:
            return {
                "provider": "deterministic_fallback",
                "plan": AgentPlanSchema(
                    action="search_hospital",
                    parameters={"district": district},
                    reason=f"Querying emergency trauma and triage centers in {district} for acute admissions.",
                    continue_investigation=True,
                ).model_dump(),
            }

        # Step 3: Helpline search
        if "search_helpline" not in actions_taken:
            return {
                "provider": "deterministic_fallback",
                "plan": AgentPlanSchema(
                    action="search_helpline",
                    parameters={"district": district},
                    reason="Querying central 1070 distress lines for civilian sightings.",
                    continue_investigation=True,
                ).model_dump(),
            }

        # Conclude investigation and handoff to human review
        return {
            "provider": "deterministic_fallback",
            "plan": AgentPlanSchema(
                action="review_candidate",
                parameters={"case_id": case_data.get("id")},
                reason="All authorized institutional sources queried. Handoff evidence dossier to human supervisory reviewer.",
                continue_investigation=False,
            ).model_dump(),
        }


class GeminiProvider(AIProvider):
    """
    Real Gemini API Planner.
    Enforces strict JSON schema validation and retry logic.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or GEMINI_API_KEY
        self.fallback = DeterministicRulePlanner()

    def _call_gemini_api(self, prompt: str) -> Optional[str]:
        if not self.api_key or self.api_key == "MY_GEMINI_API_KEY":
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        part = candidates[0].get("content", {}).get("parts", [])[0]
                        return part.get("text", "")
        except Exception as e:
            logger.warning(f"Gemini API request failed: {e}")
        return None

    def plan(
        self,
        case_data: Dict[str, Any],
        previous_steps: List[Dict[str, Any]],
        current_candidates: List[Dict[str, Any]],
        contradictions: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        prompt = f"""
You are the AI Planner for REUNIFY, a disaster missing-person evidence investigation system.
Core Principle: The LLM reasons. The system verifies. The human decides.

Allowed actions MUST come from this allowlist ONLY:
{ALLOWLISTED_ACTIONS}

Case Context:
{json.dumps(case_data, indent=2)}

Previous Investigation Steps:
{json.dumps(previous_steps[-4:] if previous_steps else [], indent=2)}

Current Candidates:
{json.dumps([{ 'code': c.get('candidate_code'), 'score': c.get('match_score'), 'contra': c.get('has_contradictions') } for c in current_candidates], indent=2)}

Active Contradictions:
{json.dumps(contradictions, indent=2)}

Requirements:
1. Return STRICT JSON with keys: 'action', 'parameters', 'reason', 'continue_investigation', 'reflection'
2. 'action' MUST be one of {ALLOWLISTED_ACTIONS}.
3. DO NOT attempt to write SQL, execute Python, approve candidates, or assign match scores.
"""

        # Attempt 1: Gemini API
        raw_json = self._call_gemini_api(prompt)
        if raw_json:
            try:
                parsed = json.loads(raw_json)
                plan_obj = AgentPlanSchema(**parsed)
                if plan_obj.action in ALLOWLISTED_ACTIONS:
                    return {"provider": "gemini", "plan": plan_obj.model_dump()}
            except Exception as e:
                logger.warning(f"Gemini output validation error on attempt 1: {e}")

        # Attempt 2: Retry with schema reminder if first attempt returned text
        if raw_json:
            retry_prompt = prompt + "\n\nCRITICAL: Previous response failed schema validation. Return valid JSON matching AgentPlanSchema."
            raw_json_retry = self._call_gemini_api(retry_prompt)
            if raw_json_retry:
                try:
                    parsed = json.loads(raw_json_retry)
                    plan_obj = AgentPlanSchema(**parsed)
                    if plan_obj.action in ALLOWLISTED_ACTIONS:
                        return {"provider": "gemini", "plan": plan_obj.model_dump()}
                except Exception as e:
                    logger.warning(f"Gemini output validation error on attempt 2: {e}")

        # Fallback to DeterministicRulePlanner
        return self.fallback.plan(case_data, previous_steps, current_candidates, contradictions)
