"""
REUNIFY Automated Test Suite (HACKSPRINT DM-05)
Covers all 14 mandatory verification, contradiction, and agent planner requirements:
1. age match (+15)
2. district match (+15)
3. clothing match (+10)
4. marks/scar match (+15)
5. name similarity (up to +20)
6. unknown field gives 0
7. wristband match (+30)
8. normal movement does NOT trigger contradiction
9. impossible movement DOES trigger contradiction
10. score SH-007 = 50 in initial state
11. SH-007 = 25 after contradiction (-25 penalty)
12. HP-015 approximately 83 after refinement
13. invalid LLM action rejected
14. invalid LLM JSON triggers fallback
"""

import pytest
from backend.verification.scoring import calculate_match_score
from backend.verification.contradiction import evaluate_contradiction
from backend.verification.feasibility import calculate_travel_feasibility, get_location_distance_km
from backend.schemas.agent import AgentPlanSchema, ALLOWLISTED_ACTIONS
from backend.tools.dispatcher import dispatch_tool
from backend.agent.planner import DeterministicRulePlanner, GeminiProvider


# Base Case Fixture: Arun Kumar (CASE-001)
@pytest.fixture
def arun_case():
    return {
        "id": "case-001",
        "case_number": "CASE-2026-0842",
        "full_name": "Arun Kumar",
        "alias": "Arun",
        "age": 22,
        "gender": "Male",
        "district": "Madurai",
        "last_seen_date": "2026-09-29",
        "last_seen_time": "19:30:00",
        "clothing_description": "Royal blue shirt, dark trousers",
        "distinguishing_marks": "Scar on left hand",
        "wristband_tag": None,  # Case does not know tag initially
    }


# Test 1: Age Match (within ±2 years gives +15)
def test_1_age_match(arun_case):
    # Candidate age 23 vs case 22 (diff 1 yr <= 2)
    record = {"estimated_age": 23}
    res = calculate_match_score(arun_case, record)
    assert res["score_breakdown"]["age_compat"] == 15

    # Candidate age 28 vs case 22 (diff 6 yrs > 2)
    record_far = {"estimated_age": 28}
    res_far = calculate_match_score(arun_case, record_far)
    assert res_far["score_breakdown"]["age_compat"] == 0


# Test 2: District Match (Same district gives +15)
def test_2_district_match(arun_case):
    record = {"district": "Madurai"}
    res = calculate_match_score(arun_case, record)
    assert res["score_breakdown"]["location"] == 15

    record_other = {"district": "Theni"}
    res_other = calculate_match_score(arun_case, record_other)
    assert res_other["score_breakdown"]["location"] == 0


# Test 3: Clothing Match (gives +10)
def test_3_clothing_match(arun_case):
    record = {"clothing_summary": "Blue shirt, jeans"}
    res = calculate_match_score(arun_case, record)
    assert res["score_breakdown"]["clothing"] == 10

    record_diff = {"clothing_summary": "Red jacket"}
    res_diff = calculate_match_score(arun_case, record_diff)
    assert res_diff["score_breakdown"]["clothing"] == 0


# Test 4: Marks / Scar Match (gives +15)
def test_4_marks_match(arun_case):
    record = {"identifying_marks": "Scar on left hand"}
    res = calculate_match_score(arun_case, record)
    assert res["score_breakdown"]["marks"] == 15


# Test 5: Name Similarity (gives up to +20)
def test_5_name_similarity(arun_case):
    # "Arunn" vs "Arun Kumar"
    record = {"person_name": "Arunn"}
    res = calculate_match_score(arun_case, record)
    assert res["score_breakdown"]["name_similarity"] >= 15
    assert res["score_breakdown"]["name_similarity"] <= 20


# Test 6: Unknown field gives 0 points (never penalized as mismatch)
def test_6_unknown_field_gives_zero(arun_case):
    empty_record = {}
    res = calculate_match_score(arun_case, empty_record)
    assert res["score_breakdown"]["age_compat"] == 0
    assert res["score_breakdown"]["clothing"] == 0
    assert res["score_breakdown"]["marks"] == 0
    assert res["score_breakdown"]["id_match"] == 0
    assert res["match_score"] == 0


# Test 7: Wristband Match (+30 when case knows tag and matches)
def test_7_wristband_match():
    case_with_tag = {
        "wristband_tag": "WB-1842",
        "age": 22,
        "district": "Madurai",
    }
    record = {"wristband_tag": "WB-1842"}
    res = calculate_match_score(case_with_tag, record)
    assert res["score_breakdown"]["id_match"] == 30

    # If case tag is None, ID match must be 0
    case_no_tag = {"wristband_tag": None}
    res_no_tag = calculate_match_score(case_no_tag, record)
    assert res_no_tag["score_breakdown"]["id_match"] == 0


# Test 8: Normal movement does NOT trigger contradiction
def test_8_normal_movement_no_contradiction():
    # Sighting A: Madurai 8:00 PM
    # Sighting B: Theni (75km) 11:30 PM (3.5 hours => ~21.5 km/h < 60 km/h)
    rec_a = {
        "external_id": "S1",
        "district": "Madurai",
        "recorded_at": "2026-09-29T20:00:00Z",
        "wristband_tag": "WB-1842",
        "source_name": "Madurai Camp",
    }
    rec_b = {
        "external_id": "S2",
        "district": "Theni",
        "recorded_at": "2026-09-29T23:30:00Z",
        "wristband_tag": "WB-1842",
        "source_name": "Theni Hospital",
    }
    contra = evaluate_contradiction(rec_a, rec_b)
    assert contra is None


# Test 9: Impossible movement DOES trigger contradiction
def test_9_impossible_movement_triggers_contradiction():
    # Sighting A: Madurai 8:10 PM (20:10)
    # Sighting B: Theni 7:45 PM (19:45) -> 25 mins for 75.2 km = 180.5 km/h (> 60 km/h)
    rec_sh007 = {
        "external_id": "SH-007",
        "district": "Madurai",
        "recorded_at": "2026-09-29T20:10:00Z",
        "wristband_tag": "WB-1842",
        "source_name": "Sellur Relief Camp",
    }
    rec_hp099 = {
        "external_id": "HP-099",
        "district": "Theni",
        "recorded_at": "2026-09-29T19:45:00Z",
        "wristband_tag": "WB-1842",
        "source_name": "Theni Medical College Hospital",
    }
    contra = evaluate_contradiction(rec_sh007, rec_hp099)
    assert contra is not None
    assert contra["has_contradiction"] is True
    assert contra["required_speed_kmh"] > 60.0
    assert len(contra["possible_explanations"]) == 3


# Test 10: Score SH-007 = 50 in initial state
def test_10_score_sh007_initial(arun_case):
    # SH-007 initial record:
    # age 23 (+15), Madurai (+15), time 8:10 PM post last seen (+10), blue shirt (+10)
    # marks unrecorded (0), name unrecorded (0), tag unrecorded in case (0)
    # Total = 15 + 15 + 10 + 10 = 50
    record_sh007 = {
        "external_id": "SH-007",
        "estimated_age": 23,
        "district": "Madurai",
        "recorded_at": "2026-09-29T20:10:00Z",
        "clothing_summary": "Blue shirt, dark pants",
        "identifying_marks": None,
        "wristband_tag": "WB-1842",
    }
    res = calculate_match_score(arun_case, record_sh007, has_contradiction=False)
    assert res["match_score"] == 50


# Test 11: SH-007 = 25 after contradiction
def test_11_score_sh007_after_contradiction(arun_case):
    record_sh007 = {
        "external_id": "SH-007",
        "estimated_age": 23,
        "district": "Madurai",
        "recorded_at": "2026-09-29T20:10:00Z",
        "clothing_summary": "Blue shirt, dark pants",
        "identifying_marks": None,
        "wristband_tag": "WB-1842",
    }
    res = calculate_match_score(arun_case, record_sh007, has_contradiction=True)
    # 50 - 25 = 25
    assert res["match_score"] == 25
    assert res["score_breakdown"]["contradiction_penalty"] == -25


# Test 12: HP-015 approximately 83 after refinement
def test_12_score_hp015_after_refinement(arun_case):
    # HP-015 refined record:
    # age 22 (+15), Madurai (+15), time (+10), blue shirt (+10), scar on left hand (+15), name "Arunn" (~+18)
    # Total = 15 + 15 + 10 + 10 + 15 + 18 = 83
    refined_hp015 = {
        "external_id": "HP-015",
        "estimated_age": 22,
        "district": "Madurai",
        "recorded_at": "2026-09-29T21:00:00Z",
        "clothing_summary": "Blue shirt, dark trousers",
        "identifying_marks": "Scar on left hand",
        "person_name": "Arunn",
    }
    res = calculate_match_score(arun_case, refined_hp015, has_contradiction=False)
    assert 80 <= res["match_score"] <= 85
    assert res["match_score"] == 83


# Test 13: Invalid LLM action rejected
def test_13_invalid_llm_action_rejected():
    with pytest.raises(ValueError):
        dispatch_tool("arbitrary_bash_command", {"cmd": "rm -rf"})

    with pytest.raises(ValueError):
        dispatch_tool("approve_candidate_directly", {"id": "c1"})


# Test 14: Invalid LLM JSON triggers fallback planner
def test_14_invalid_llm_json_triggers_fallback(arun_case):
    provider = GeminiProvider(api_key="INVALID_TEST_KEY_TRIGGERS_FALLBACK")
    plan_res = provider.plan(
        case_data=arun_case,
        previous_steps=[],
        current_candidates=[],
        contradictions=[],
    )
    # Must fallback cleanly to deterministic planner
    assert plan_res["provider"] == "deterministic_fallback"
    assert plan_res["plan"]["action"] in ALLOWLISTED_ACTIONS
