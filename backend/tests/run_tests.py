"""
REUNIFY Test Suite Runner
Runs all 14 verification, contradiction, and agent tests.
Works with both pytest and pure Python standard library.
"""

import sys
from backend.verification.scoring import calculate_match_score
from backend.verification.contradiction import evaluate_contradiction
from backend.verification.feasibility import calculate_travel_feasibility, get_location_distance_km
from backend.schemas.agent import AgentPlanSchema, ALLOWLISTED_ACTIONS
from backend.tools.dispatcher import dispatch_tool
from backend.agent.planner import DeterministicRulePlanner, GeminiProvider

ARUN_CASE = {
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
    "wristband_tag": None,
}


def run_all_tests():
    passed = 0
    total = 14

    print("==================================================")
    print("REUNIFY AUTOMATED VERIFICATION TEST SUITE (DM-05)")
    print("==================================================")

    # 1. Age match
    r1 = calculate_match_score(ARUN_CASE, {"estimated_age": 23})
    assert r1["score_breakdown"]["age_compat"] == 15, "Test 1 failed"
    r1_far = calculate_match_score(ARUN_CASE, {"estimated_age": 28})
    assert r1_far["score_breakdown"]["age_compat"] == 0, "Test 1 far age failed"
    print("✓ Test 1: Age match (within ±2 years gives +15, outside gives 0)")
    passed += 1

    # 2. District match
    r2 = calculate_match_score(ARUN_CASE, {"district": "Madurai"})
    assert r2["score_breakdown"]["location"] == 15, "Test 2 failed"
    r2_diff = calculate_match_score(ARUN_CASE, {"district": "Theni"})
    assert r2_diff["score_breakdown"]["location"] == 0, "Test 2 mismatch failed"
    print("✓ Test 2: District match (Same district gives +15, different gives 0)")
    passed += 1

    # 3. Clothing match
    r3 = calculate_match_score(ARUN_CASE, {"clothing_summary": "Blue shirt, jeans"})
    assert r3["score_breakdown"]["clothing"] == 10, "Test 3 failed"
    print("✓ Test 3: Clothing match (Color/garment token gives +10)")
    passed += 1

    # 4. Marks / Scar match
    r4 = calculate_match_score(ARUN_CASE, {"identifying_marks": "Scar on left hand"})
    assert r4["score_breakdown"]["marks"] == 15, "Test 4 failed"
    print("✓ Test 4: Marks match (Anatomical scar token gives +15)")
    passed += 1

    # 5. Name similarity
    r5 = calculate_match_score(ARUN_CASE, {"person_name": "Arunn"})
    assert 15 <= r5["score_breakdown"]["name_similarity"] <= 20, "Test 5 failed"
    print(f"✓ Test 5: Name similarity ('Arunn' vs 'Arun Kumar' gives +{r5['score_breakdown']['name_similarity']})")
    passed += 1

    # 6. Unknown field gives 0
    r6 = calculate_match_score(ARUN_CASE, {})
    assert r6["match_score"] == 0, "Test 6 failed"
    print("✓ Test 6: Unknown field gives 0 points (never penalized as mismatch)")
    passed += 1

    # 7. Wristband match
    case_with_tag = {"wristband_tag": "WB-1842", "age": 22, "district": "Madurai"}
    r7 = calculate_match_score(case_with_tag, {"wristband_tag": "WB-1842"})
    assert r7["score_breakdown"]["id_match"] == 30, "Test 7 tag match failed"
    r7_notag = calculate_match_score({"wristband_tag": None}, {"wristband_tag": "WB-1842"})
    assert r7_notag["score_breakdown"]["id_match"] == 0, "Test 7 unknown tag failed"
    print("✓ Test 7: Wristband match (+30 when case knows tag, 0 when unknown)")
    passed += 1

    # 8. Normal movement does NOT trigger contradiction
    rec_a = {"district": "Madurai", "recorded_at": "2026-09-29T20:00:00Z", "wristband_tag": "WB-1842"}
    rec_b = {"district": "Theni", "recorded_at": "2026-09-29T23:30:00Z", "wristband_tag": "WB-1842"}
    assert evaluate_contradiction(rec_a, rec_b) is None, "Test 8 failed"
    print("✓ Test 8: Normal feasible movement does NOT trigger contradiction")
    passed += 1

    # 9. Impossible movement DOES trigger contradiction
    rec_sh = {"district": "Madurai", "recorded_at": "2026-09-29T20:10:00Z", "wristband_tag": "WB-1842", "source_name": "Sellur Camp"}
    rec_hp = {"district": "Theni", "recorded_at": "2026-09-29T19:45:00Z", "wristband_tag": "WB-1842", "source_name": "Theni Hospital"}
    contra = evaluate_contradiction(rec_sh, rec_hp)
    assert contra is not None and contra["has_contradiction"] is True, "Test 9 failed"
    assert contra["required_speed_kmh"] > 60.0, "Test 9 speed failed"
    print(f"✓ Test 9: Impossible movement DOES trigger contradiction ({contra['required_speed_kmh']} km/h > 60 km/h)")
    passed += 1

    # 10. Score SH-007 = 50 in initial state
    rec_sh007 = {
        "external_id": "SH-007",
        "estimated_age": 23,
        "district": "Madurai",
        "recorded_at": "2026-09-29T20:10:00Z",
        "clothing_summary": "Blue shirt, dark pants",
        "identifying_marks": None,
        "wristband_tag": "WB-1842",
    }
    r10 = calculate_match_score(ARUN_CASE, rec_sh007, has_contradiction=False)
    assert r10["match_score"] == 50, f"Test 10 failed: expected 50, got {r10['match_score']}"
    print("✓ Test 10: Score SH-007 = 50 in initial state (Age:15 + Loc:15 + Time:10 + Clothes:10)")
    passed += 1

    # 11. SH-007 = 25 after contradiction
    r11 = calculate_match_score(ARUN_CASE, rec_sh007, has_contradiction=True)
    assert r11["match_score"] == 25, f"Test 11 failed: expected 25, got {r11['match_score']}"
    assert r11["score_breakdown"]["contradiction_penalty"] == -25, "Test 11 penalty failed"
    print("✓ Test 11: SH-007 = 25 after contradiction (-25 penalty applied)")
    passed += 1

    # 12. HP-015 approximately 83 after refinement
    refined_hp015 = {
        "external_id": "HP-015",
        "estimated_age": 22,
        "district": "Madurai",
        "recorded_at": "2026-09-29T21:00:00Z",
        "clothing_summary": "Blue shirt, dark trousers",
        "identifying_marks": "Scar on left hand",
        "person_name": "Arunn",
    }
    r12 = calculate_match_score(ARUN_CASE, refined_hp015, has_contradiction=False)
    assert 80 <= r12["match_score"] <= 85, f"Test 12 failed: got {r12['match_score']}"
    print(f"✓ Test 12: HP-015 score = {r12['match_score']} (approximately 83) after refinement")
    passed += 1

    # 13. Invalid LLM action rejected
    try:
        dispatch_tool("arbitrary_python_exec", {})
        assert False, "Test 13 failed: allowlist not enforced"
    except ValueError:
        print("✓ Test 13: Invalid LLM action rejected by allowlist dispatcher")
        passed += 1

    # 14. Invalid LLM JSON triggers fallback planner
    provider = GeminiProvider(api_key="INVALID_TEST_KEY")
    plan_res = provider.plan(ARUN_CASE, [], [], [])
    assert plan_res["provider"] == "deterministic_fallback", "Test 14 failed"
    assert plan_res["plan"]["action"] in ALLOWLISTED_ACTIONS, "Test 14 action failed"
    print("✓ Test 14: Invalid LLM JSON triggers fallback planner cleanly")
    passed += 1

    print("==================================================")
    print(f"ALL {passed}/{total} TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_all_tests()
