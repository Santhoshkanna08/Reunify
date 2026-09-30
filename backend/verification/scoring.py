"""
REUNIFY Deterministic Verification & Scoring Engine
Pure Python mathematical implementation based on centralized weights.
NEVER put scoring logic inside the LLM.
"""

from typing import Dict, Any, List, Optional
from difflib import SequenceMatcher
from .scoring_config import (
    ID_MATCH_POINTS,
    AGE_COMPAT_POINTS,
    DISTRICT_MATCH_POINTS,
    TIME_COMPAT_POINTS,
    CLOTHING_MATCH_POINTS,
    MARKS_MATCH_POINTS,
    NAME_SIMILARITY_MAX_POINTS,
    CONTRADICTION_PENALTY,
    UNKNOWN_FIELD_POINTS,
)
from .feasibility import parse_timestamp


def compute_string_similarity(str_a: Optional[str], str_b: Optional[str]) -> float:
    """Computes normalized string similarity (0.0 to 1.0)."""
    if not str_a or not str_b:
        return 0.0
    a = str_a.strip().lower()
    b = str_b.strip().lower()
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    # Direct substring inclusion
    if a in b or b in a:
        ratio = len(min(a, b, key=len)) / len(max(a, b, key=len))
        return max(ratio, SequenceMatcher(None, a, b).ratio())
    return SequenceMatcher(None, a, b).ratio()


def has_token_intersection(text_a: Optional[str], text_b: Optional[str]) -> bool:
    """Checks if two descriptive texts share meaningful descriptive keywords."""
    if not text_a or not text_b:
        return False
    stop_words = {"a", "an", "the", "in", "on", "at", "with", "and", "or", "of", "to", "worn", "wear"}
    tokens_a = {
        w.strip().lower()
        for w in text_a.replace(",", " ").replace(".", " ").split()
        if len(w) > 2 and w.lower() not in stop_words
    }
    tokens_b = {
        w.strip().lower()
        for w in text_b.replace(",", " ").replace(".", " ").split()
        if len(w) > 2 and w.lower() not in stop_words
    }
    return len(tokens_a.intersection(tokens_b)) > 0


def calculate_match_score(
    case_data: Dict[str, Any],
    record_data: Dict[str, Any],
    has_contradiction: bool = False,
) -> Dict[str, Any]:
    """
    Computes evidence-based match score deterministically.
    Label: 'Evidence-based match score' (0 - 100).
    """
    score_breakdown: Dict[str, int] = {}
    audit_notes: List[str] = []

    # 1. ID / Wristband Match (+30)
    # Section 7 rule: Compare case.wristband_tag == record.wristband_tag.
    # Do NOT compare wristband ID against distinguishing_marks.
    # If the case does not know the identifier: ID match = 0.
    case_tag = (case_data.get("wristband_tag") or "").strip().lower()
    record_tag = (record_data.get("wristband_tag") or "").strip().lower()

    if case_tag and record_tag and case_tag == record_tag:
        score_breakdown["id_match"] = ID_MATCH_POINTS
        audit_notes.append(f"Official ID/Wristband match ({record_tag}): +{ID_MATCH_POINTS}")
    else:
        score_breakdown["id_match"] = UNKNOWN_FIELD_POINTS
        if not case_tag:
            audit_notes.append("Case wristband tag unrecorded: 0 pts")

    # 2. Age Compatibility within ±2 years (+15)
    case_age = case_data.get("age")
    record_age = record_data.get("estimated_age")
    if case_age is not None and record_age is not None:
        try:
            diff = abs(int(case_age) - int(record_age))
            if diff <= 2:
                score_breakdown["age_compat"] = AGE_COMPAT_POINTS
                audit_notes.append(f"Age compatible ({record_age} vs {case_age}, diff={diff}y): +{AGE_COMPAT_POINTS}")
            else:
                score_breakdown["age_compat"] = 0
                audit_notes.append(f"Age outside ±2 threshold ({record_age} vs {case_age}): 0 pts")
        except (ValueError, TypeError):
            score_breakdown["age_compat"] = 0
    else:
        score_breakdown["age_compat"] = UNKNOWN_FIELD_POINTS
        audit_notes.append("Age unrecorded in record: 0 pts (not penalized)")

    # 3. Same District (+15)
    case_district = (case_data.get("district") or "").strip().lower()
    record_district = (record_data.get("district") or "").strip().lower()
    if case_district and record_district and case_district == record_district:
        score_breakdown["location"] = DISTRICT_MATCH_POINTS
        audit_notes.append(f"Same administrative district ({case_district}): +{DISTRICT_MATCH_POINTS}")
    else:
        score_breakdown["location"] = 0
        audit_notes.append(f"District mismatch ({record_district} vs {case_district}): 0 pts")

    # 4. Chronological Compatibility (+10)
    # Record recorded at or after last seen time
    case_date = case_data.get("last_seen_date")
    case_time = case_data.get("last_seen_time") or "12:00:00"
    case_dt_str = f"{case_date} {case_time}" if case_date else None
    case_dt = parse_timestamp(case_dt_str)
    record_dt = parse_timestamp(record_data.get("recorded_at"))

    if case_dt and record_dt:
        if record_dt >= case_dt:
            score_breakdown["time"] = TIME_COMPAT_POINTS
            audit_notes.append(f"Chronologically compatible: +{TIME_COMPAT_POINTS}")
        else:
            score_breakdown["time"] = 0
            audit_notes.append("Recorded before last seen timestamp: 0 pts")
    elif record_dt:
        score_breakdown["time"] = TIME_COMPAT_POINTS
        audit_notes.append("Record timestamp valid: +10 pts")
    else:
        score_breakdown["time"] = UNKNOWN_FIELD_POINTS

    # 5. Clothing Match (+10)
    case_clothing = case_data.get("clothing_description")
    record_clothing = record_data.get("clothing_summary")
    if has_token_intersection(case_clothing, record_clothing):
        score_breakdown["clothing"] = CLOTHING_MATCH_POINTS
        audit_notes.append(f"Clothing tokens matched: +{CLOTHING_MATCH_POINTS}")
    else:
        score_breakdown["clothing"] = UNKNOWN_FIELD_POINTS
        audit_notes.append("Clothing unrecorded or distinct: 0 pts")

    # 6. Distinguishing Marks (+15)
    case_marks = case_data.get("distinguishing_marks")
    record_marks = record_data.get("identifying_marks")
    if has_token_intersection(case_marks, record_marks):
        score_breakdown["marks"] = MARKS_MATCH_POINTS
        audit_notes.append(f"Distinguishing anatomical marks matched: +{MARKS_MATCH_POINTS}")
    else:
        score_breakdown["marks"] = UNKNOWN_FIELD_POINTS
        audit_notes.append("Marks unrecorded or distinct: 0 pts")

    # 7. Name Similarity (up to +20)
    record_name = record_data.get("person_name")
    if record_name and record_name.strip():
        candidates_to_compare = []
        if case_data.get("full_name"):
            candidates_to_compare.append(case_data["full_name"])
            for part in case_data["full_name"].split():
                if len(part) >= 3:
                    candidates_to_compare.append(part)
        if case_data.get("alias"):
            candidates_to_compare.append(case_data["alias"])

        best_sim = 0.0
        for cand_name in candidates_to_compare:
            s = compute_string_similarity(cand_name, record_name)
            if s > best_sim:
                best_sim = s

        if best_sim >= 0.70:
            name_pts = round(best_sim * NAME_SIMILARITY_MAX_POINTS)
            score_breakdown["name_similarity"] = name_pts
            audit_notes.append(f"Name similarity '{record_name}' ({best_sim:.2f}): +{name_pts}")
        else:
            score_breakdown["name_similarity"] = 0
    else:
        score_breakdown["name_similarity"] = UNKNOWN_FIELD_POINTS

    # 8. Contradiction Penalty (-25)
    if has_contradiction:
        score_breakdown["contradiction_penalty"] = CONTRADICTION_PENALTY
        audit_notes.append(f"Contradiction penalty applied: {CONTRADICTION_PENALTY}")
    else:
        score_breakdown["contradiction_penalty"] = 0

    # Total Sum clamped to [0, 100]
    raw_total = sum(score_breakdown.values())
    total_score = max(0, min(100, raw_total))

    return {
        "match_score": total_score,
        "score_breakdown": score_breakdown,
        "audit_notes": audit_notes,
    }
