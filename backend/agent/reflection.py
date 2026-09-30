"""
REUNIFY Concrete Reflection Engine
Triggers when:
1. Contradiction is detected
2. Candidate score changes significantly
3. New evidence arrives (e.g. injected record)
4. Selected tool returns insufficient information
"""

from typing import Dict, Any, List, Optional


def check_reflection_needed(
    contradictions: List[Dict[str, Any]],
    score_change_delta: float = 0.0,
    new_evidence_arrived: bool = False,
    tool_empty: bool = False,
) -> Optional[Dict[str, Any]]:
    """
    Evaluates whether reflection should be triggered and formulates the reflection context.
    """
    if contradictions:
        c = contradictions[0]
        src_a = (c.get("sourceA") or c.get("source_a") or {}).get("location") or (c.get("sourceA") or c.get("source_a") or {}).get("name") or "Source A"
        src_b = (c.get("sourceB") or c.get("source_b") or {}).get("location") or (c.get("sourceB") or c.get("source_b") or {}).get("name") or "Source B"
        speed = c.get("required_speed_kmh", 0)
        threshold = c.get("threshold_speed_kmh", 60)
        return {
            "triggered": True,
            "trigger_type": "contradiction_detected",
            "reason": (
                f"Contradiction detected between {src_a} and {src_b}. "
                f"Required transit speed of {speed} km/h exceeds plausible limit ({threshold} km/h). "
                "Current evidence is physically inconsistent. Pausing automated conclusion and searching alternative sources."
            ),
            "suggested_next_action": "search_helpline",
        }

    if abs(score_change_delta) >= 15.0:
        direction = "increased" if score_change_delta > 0 else "decreased"
        return {
            "triggered": True,
            "trigger_type": "significant_score_change",
            "reason": (
                f"Candidate match score {direction} significantly by {abs(score_change_delta)} points. "
                "Reconciling updated attributes against reported case profile."
            ),
            "suggested_next_action": "search_hospital",
        }

    if new_evidence_arrived:
        return {
            "triggered": True,
            "trigger_type": "new_evidence_arrived",
            "reason": "New supplemental evidence was received for active candidate. Triggering deterministic verification re-score.",
            "suggested_next_action": "verify",
        }

    if tool_empty:
        return {
            "triggered": True,
            "trigger_type": "insufficient_source_data",
            "reason": "Queried source returned zero records. Broadening search radius to neighboring emergency facilities.",
            "suggested_next_action": "search_helpline",
        }

    return None
