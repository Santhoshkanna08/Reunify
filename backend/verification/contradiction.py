"""
REUNIFY Contradiction Engine
Evaluates whether records exhibit spatiotemporal physical impossibility.
NOTE: Same wristband ID by itself is NOT a contradiction.
A contradiction requires: same identifier + different locations + time difference + physically infeasible movement.
Returns 3 concrete hypotheses without declaring a machine conclusion.
"""

from typing import Dict, Any, Optional, List
from .verification_config import MAX_PLAUSIBLE_SPEED_KMH
from .feasibility import calculate_travel_feasibility


def evaluate_contradiction(
    rec_a: Dict[str, Any],
    rec_b: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """
    Evaluates contradiction between two source records.
    Returns contradiction dictionary with hypotheses, or None if no contradiction exists.
    """
    id_a = rec_a.get("id") or rec_a.get("external_id")
    id_b = rec_b.get("id") or rec_b.get("external_id")
    if id_a and id_b and id_a == id_b:
        return None  # Same record

    tag_a = (rec_a.get("wristband_tag") or "").strip().lower()
    tag_b = (rec_b.get("wristband_tag") or "").strip().lower()

    # Rule 1: Check shared unique identifier (e.g. wristband WB-1842)
    has_shared_tag = bool(tag_a and tag_b and tag_a == tag_b)

    # Feasibility check
    feasibility = calculate_travel_feasibility(
        district_a=rec_a.get("district"),
        time_a=rec_a.get("recorded_at"),
        district_b=rec_b.get("district"),
        time_b=rec_b.get("recorded_at"),
    )

    if feasibility.get("location_data_insufficient"):
        # Geographic/temporal info is insufficient: DO NOT invent a contradiction
        return None

    distance_km = feasibility["distance_km"]
    time_diff_minutes = feasibility["time_diff_minutes"]
    required_speed_kmh = feasibility["required_speed_kmh"]

    # Contradiction condition:
    # Same identifier across locations requiring movement > MAX_PLAUSIBLE_SPEED_KMH
    # OR completely different locations with impossible speed if linked to the same individual
    is_speed_impossible = (
        distance_km > 10.0 and required_speed_kmh > MAX_PLAUSIBLE_SPEED_KMH
    )

    # If same wristband tag exists AND movement is physically impossible:
    # OR if claimed to be the same candidate in two distant places at the same time:
    if has_shared_tag and is_speed_impossible:
        hypotheses: List[str] = [
            "Data-entry error: Intake timestamp was logged after transfer rather than actual arrival time.",
            "Identifier misread: Wristband barcode or series was misread or duplicate batch issued.",
            "Two different people sharing/misusing the identifier: Tag was reissued or worn by another admittee.",
        ]

        return {
            "has_contradiction": True,
            "title": f"Spatiotemporal Feasibility Contradiction (Tag: {rec_a.get('wristband_tag')})",
            "distance_km": distance_km,
            "time_diff_minutes": time_diff_minutes,
            "required_speed_kmh": required_speed_kmh,
            "threshold_speed_kmh": MAX_PLAUSIBLE_SPEED_KMH,
            "sourceA": {
                "location": rec_a.get("source_name") or rec_a.get("location_name") or rec_a.get("district"),
                "time": str(rec_a.get("recorded_at")),
                "external_id": rec_a.get("external_id") or rec_a.get("id"),
            },
            "sourceB": {
                "location": rec_b.get("source_name") or rec_b.get("location_name") or rec_b.get("district"),
                "time": str(rec_b.get("recorded_at")),
                "external_id": rec_b.get("external_id") or rec_b.get("id"),
            },
            "possible_explanations": hypotheses,
            "requires_human_review": True,
        }

    return None
