// REUNIFY Deterministic Verification Engine
// Implements strict mathematical scoring. Independent from LLM hallucination.
// Label: "Evidence-based match score" (0 - 100)

import { MissingPersonCase, SourceRecord, ScoreBreakdown } from '../../types';

// String similarity using Levenshtein distance normalized
function stringSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1.toLowerCase().trim() : s2.toLowerCase().trim();
  const shorter = s1.length > s2.length ? s2.toLowerCase().trim() : s1.toLowerCase().trim();
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  if (longer.includes(shorter) || shorter.includes(longer)) {
    return 0.90;
  }

  const costs = new Array();
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  const editDistance = costs[shorter.length];
  return Math.max(0, (longerLength - editDistance) / longerLength);
}

// Token keyword matching
function keywordOverlap(textA?: string, textB?: string): boolean {
  if (!textA || !textB) return false;
  const tokensA = textA.toLowerCase().split(/[\s,.-]+/).filter((w) => w.length > 2);
  const tokensB = textB.toLowerCase().split(/[\s,.-]+/).filter((w) => w.length > 2);
  const common = tokensA.filter((t) => tokensB.includes(t));
  return common.length > 0;
}

export function calculateDeterministicScore(
  personCase: MissingPersonCase,
  record: SourceRecord,
  hasContradiction = false,
  contradictionPenalty = 25
): ScoreBreakdown {
  const notes: string[] = [];

  // 1. ID Match (+30)
  // Section 7 rule: Compare case.wristband_tag == record.wristband_tag.
  // Do NOT compare wristband ID against distinguishing_marks.
  // If the case does not know the identifier: ID match = 0.
  let id_match = 0;
  const caseTag = (personCase.wristband_tag || '').trim().toLowerCase();
  const recordTag = (record.wristband_tag || '').trim().toLowerCase();
  if (caseTag && recordTag && caseTag === recordTag) {
    id_match = 30;
    notes.push(`Known identifier tag ${record.wristband_tag} match: +30 pts`);
  } else {
    id_match = 0;
    notes.push('Wristband tag unrecorded or unmatched: 0 pts');
  }

  // 2. Age Compatibility (+15)
  // Within ±2 years
  let age_compat = 0;
  if (record.estimated_age !== undefined && record.estimated_age !== null) {
    const ageDiff = Math.abs(personCase.age - record.estimated_age);
    if (ageDiff <= 2) {
      age_compat = 15;
      notes.push(`Age compatible (${record.estimated_age} vs ${personCase.age}, ±${ageDiff} yrs): +15 pts`);
    } else {
      notes.push(`Age discrepancy (${record.estimated_age} vs ${personCase.age}): 0 pts`);
    }
  } else {
    notes.push('Age unknown in record: 0 pts (not penalized)');
  }

  // 3. District / Location Match (+15)
  let location = 0;
  if (
    record.district &&
    personCase.district &&
    record.district.toLowerCase().trim() === personCase.district.toLowerCase().trim()
  ) {
    location = 15;
    notes.push(`Exact district match (${record.district}): +15 pts`);
  } else {
    notes.push(`District mismatch/unconfirmed: 0 pts`);
  }

  // 4. Time Compatibility (+10)
  // Source record timestamp is at or after last seen time
  let time = 0;
  try {
    const lastSeenIso = `${personCase.last_seen_date}T${personCase.last_seen_time || '12:00'}:00Z`;
    const lastSeenTime = new Date(lastSeenIso).getTime();
    const recordedTime = new Date(record.recorded_at).getTime();

    if (!isNaN(recordedTime) && !isNaN(lastSeenTime)) {
      if (recordedTime >= lastSeenTime) {
        time = 10;
        notes.push('Temporal chronology compatible (recorded post last seen): +10 pts');
      } else {
        notes.push('Recorded prior to last seen time: 0 pts');
      }
    } else {
      time = 10;
    }
  } catch {
    time = 10;
  }

  // 5. Clothing Match (+10)
  let clothing = 0;
  if (keywordOverlap(personCase.clothing_description, record.clothing_summary)) {
    clothing = 10;
    notes.push('Clothing color/garment keywords match: +10 pts');
  } else {
    notes.push('Clothing unrecorded or distinct: 0 pts');
  }

  // 6. Marks Match (+15)
  let marks = 0;
  if (keywordOverlap(personCase.distinguishing_marks, record.identifying_marks)) {
    marks = 15;
    notes.push('Distinguishing bodily mark/scar match: +15 pts');
  } else {
    notes.push('Distinct marks unrecorded or not observed: 0 pts');
  }

  // 7. Name Similarity (up to +20)
  let name_similarity = 0;
  if (record.person_name && record.person_name.trim()) {
    const namesToTest = [
      personCase.full_name,
      ...personCase.full_name.split(' ').filter((w) => w.length >= 3),
      personCase.alias,
    ].filter(Boolean) as string[];

    let bestSim = 0.0;
    for (const nameCandidate of namesToTest) {
      const s = stringSimilarity(nameCandidate, record.person_name);
      if (s > bestSim) bestSim = s;
    }

    if (bestSim >= 0.70) {
      name_similarity = Math.round(bestSim * 20);
      notes.push(`Name similarity "${record.person_name}" (${Math.round(bestSim * 100)}%): +${name_similarity} pts`);
    } else {
      notes.push('Name similarity below threshold: 0 pts');
    }
  } else {
    notes.push('Patient unnamed in intake: 0 pts');
  }

  // 8. Contradiction Penalty (-25)
  const contradiction_penalty = hasContradiction ? -contradictionPenalty : 0;
  if (hasContradiction) {
    notes.push(`Spatiotemporal physical contradiction penalty applied: -${contradictionPenalty} pts`);
  }

  const rawSum =
    id_match +
    age_compat +
    location +
    time +
    clothing +
    marks +
    name_similarity +
    contradiction_penalty;

  const total = Math.max(0, Math.min(100, rawSum));

  return {
    id_match,
    age_compat,
    location,
    time,
    clothing,
    marks,
    name_similarity,
    contradiction_penalty,
    total,
    notes,
  };
}
