// REUNIFY AI Provider Abstraction Layer
// Encapsulates LLM reasoning behind a strict provider interface
// Supports Gemini API + Deterministic Structured Planner Fallback

import { MissingPersonCase, SourceRecord, Contradiction } from '../../types';

export interface InvestigationPlanOutput {
  thought_process: string;
  missing_information: string[];
  recommended_tool: 'search_shelter' | 'search_hospital' | 'search_helpline' | 'search_ngo';
  tool_parameters: Record<string, unknown>;
  reflection?: string;
  replan_reason?: string;
  is_investigation_complete: boolean;
  handoff_to_human_reviewer: boolean;
}

export interface AIProvider {
  planNextStep(
    personCase: MissingPersonCase,
    existingRecords: SourceRecord[],
    currentContradictions: Contradiction[],
    currentPhase: string
  ): Promise<InvestigationPlanOutput>;
}

export class DeterministicRulePlanner implements AIProvider {
  async planNextStep(
    personCase: MissingPersonCase,
    existingRecords: SourceRecord[],
    currentContradictions: Contradiction[],
    currentPhase: string
  ): Promise<InvestigationPlanOutput> {
    const hasShelter = existingRecords.some((r) => r.source_type === 'shelter');
    const hasHospital = existingRecords.some((r) => r.source_type === 'hospital');
    const hasHelpline = existingRecords.some((r) => r.source_type === 'helpline');
    const hasNGO = existingRecords.some((r) => r.source_type === 'ngo');

    // Case 1: Active contradiction requires reflection and re-planning
    if (currentContradictions.length > 0 && currentPhase !== 'replan') {
      const c = currentContradictions[0];
      return {
        thought_process: `Contradiction detected between ${c.sourceA.name} and ${c.sourceB.name}. Required travel speed is ${c.required_speed_kmh} km/h, which is physically impossible. Reflecting on data entry delay vs duplicate identifier. Re-planning to cross-verify against helpline intake logs.`,
        missing_information: [
          'Secondary eyewitness confirmation in primary district',
          'Field officer verification of physical wristband presence',
        ],
        recommended_tool: 'search_helpline',
        tool_parameters: {
          district: personCase.district,
          time_window: [personCase.last_seen_time, '22:00'],
          keywords: [personCase.full_name, personCase.clothing_description.split(' ')[0]],
        },
        reflection: `The contradiction between ${c.sourceA.location} and ${c.sourceB.location} suggests a clerical tag clash rather than physical teleportation. The LLM cannot override physical reality; human verification is required.`,
        replan_reason: 'Branching investigation to citizen helpline calls for corroborating sightings.',
        is_investigation_complete: false,
        handoff_to_human_reviewer: true,
      };
    }

    // Step 1: Query Shelters in primary district
    if (!hasShelter) {
      return {
        thought_process: `Missing person ${personCase.full_name} was last seen in ${personCase.district}. During active disaster relief, high proportion of displaced individuals seek shelter at SDMA relief camps. Prioritizing shelter registry scan.`,
        missing_information: ['Current shelter registry admission logs', 'Intake bed rosters in ' + personCase.district],
        recommended_tool: 'search_shelter',
        tool_parameters: {
          district: personCase.district,
          gender: personCase.gender,
          age_range: [Math.max(1, personCase.age - 3), personCase.age + 3],
          keywords: personCase.clothing_description.split(' ').slice(0, 3),
        },
        is_investigation_complete: false,
        handoff_to_human_reviewer: false,
      };
    }

    // Step 2: Query Hospitals
    if (!hasHospital) {
      return {
        thought_process: `Shelter records collected. Now querying emergency hospital networks (HIMS) to check for triage admissions matching medical description and physical markers.`,
        missing_information: ['Emergency triage logs', 'Medical tags and wristbands'],
        recommended_tool: 'search_hospital',
        tool_parameters: {
          district: personCase.district,
          gender: personCase.gender,
          wristband_tag: existingRecords[0]?.wristband_tag,
        },
        is_investigation_complete: false,
        handoff_to_human_reviewer: false,
      };
    }

    // Step 3: Query Helplines
    if (!hasHelpline) {
      return {
        thought_process: `Cross-referencing citizen distress logs and 1070 helpline transcripts for bystander reports matching last known location.`,
        missing_information: ['Unverified civilian sightings in ' + personCase.last_known_location],
        recommended_tool: 'search_helpline',
        tool_parameters: {
          district: personCase.district,
          name_keyword: personCase.full_name,
        },
        is_investigation_complete: false,
        handoff_to_human_reviewer: false,
      };
    }

    // Step 4: Query NGOs
    if (!hasNGO) {
      return {
        thought_process: `Checking humanitarian NGO volunteer registries for community transit and aid distribution logs.`,
        missing_information: ['NGO volunteer sighting logs'],
        recommended_tool: 'search_ngo',
        tool_parameters: {
          district: personCase.district,
        },
        is_investigation_complete: false,
        handoff_to_human_reviewer: true,
      };
    }

    // Default: Completed evidence sweep
    return {
      thought_process: `All authorized sources (Shelters, Hospitals, Helplines, NGOs) queried. Evidence reconciliation complete. Ready for human forensic review.`,
      missing_information: [],
      recommended_tool: 'search_shelter',
      tool_parameters: {},
      is_investigation_complete: true,
      handoff_to_human_reviewer: true,
    };
  }
}

export const defaultAIProvider = new DeterministicRulePlanner();
