// REUNIFY Autonomous Investigation Service & Pipeline
// Coordinates:
// 1. Planner (Structured reasoning & missing information identification)
// 2. Allowlisted Tool Execution (Backend dispatches to adapters)
// 3. Evidence Normalization
// 4. Deterministic Verification & Scoring
// 5. Spatiotemporal Contradiction Analysis
// 6. Reflection & Re-planning
// 7. Escalation to Human Review
// Principle: "THE LLM REASONS. THE SYSTEM VERIFIES. THE HUMAN DECIDES."

import {
  MissingPersonCase,
  Investigation,
  SourceRecord,
  Candidate,
  Contradiction,
  AgentEvent,
} from '../../types';
import { db } from '../../lib/supabaseClient';
import { sourceRegistry } from '../adapters/SourceAdapter';
import { calculateDeterministicScore } from '../verification/verificationEngine';
import { detectContradictionBetweenRecords } from '../verification/contradictionEngine';
import { defaultAIProvider } from './aiProvider';

export class InvestigationService {
  /**
   * Run one single autonomous step of the investigation pipeline
   */
  async executeNextStep(
    caseId: string,
    onProgress?: (event: AgentEvent) => void
  ): Promise<{ investigation: Investigation; isComplete: boolean }> {
    const personCase = await db.getCaseById(caseId);
    if (!personCase) throw new Error(`Case ${caseId} not found`);

    let investigation = await db.getInvestigationByCaseId(caseId);
    if (!investigation) {
      investigation = await db.createOrUpdateInvestigation({
        case_id: caseId,
        state: 'in_progress',
        current_phase: 'evidence_collection',
        summary: `Investigation started for ${personCase.full_name} (${personCase.case_number})`,
      });

      const startEvt = await db.addAgentEvent({
        case_id: caseId,
        investigation_id: investigation.id,
        event_type: 'agent_started',
        headline: `Autonomous Investigation Initialized`,
        description: `Agent began investigation for ${personCase.full_name}, age ${personCase.age}, district ${personCase.district}. Allowlisted tools active.`,
      });
      onProgress?.(startEvt);

      await db.addAuditLog({
        case_id: caseId,
        actor_name: 'Reunify Autonomous Agent',
        actor_role: 'investigator',
        action: 'investigation_started',
        entity_type: 'investigations',
        entity_id: investigation.id,
        details: { case_number: personCase.case_number },
        ip_address: 'internal-agent',
      });
    }

    // Load existing records and candidates
    const existingCandidates = await db.getCandidates(caseId);
    const existingRecords: SourceRecord[] = [];
    for (const c of existingCandidates) {
      if (c.source_record) existingRecords.push(c.source_record);
    }

    // Gather existing contradictions
    const currentContradictions: Contradiction[] = [];
    for (const c of existingCandidates) {
      if (c.contradictions) currentContradictions.push(...c.contradictions);
    }

    // 1. LLM / AI Planner decides next action
    const plan = await defaultAIProvider.planNextStep(
      personCase,
      existingRecords,
      currentContradictions,
      investigation.current_phase
    );

    const existingSteps = await db.getInvestigationSteps(investigation.id);
    const nextStepOrder = existingSteps.length + 1;

    // Handle Reflection state if contradiction exists
    if (plan.reflection) {
      investigation = await db.createOrUpdateInvestigation({
        case_id: caseId,
        state: 'needs_reassessment',
        current_phase: 'contradiction_reflection',
        summary: plan.thought_process,
      });

      const reflectEvt = await db.addAgentEvent({
        case_id: caseId,
        investigation_id: investigation.id,
        event_type: 'agent_reflected',
        headline: 'Agent Reflected on Contradiction',
        description: plan.reflection,
        payload: { contradiction_count: currentContradictions.length },
      });
      onProgress?.(reflectEvt);

      await db.addInvestigationStep({
        investigation_id: investigation.id,
        step_order: nextStepOrder,
        phase: 'reflect',
        action_name: 'Agent Contradiction Reflection',
        reasoning: plan.thought_process,
        reflection_notes: plan.reflection,
      });

      if (plan.replan_reason) {
        const replanEvt = await db.addAgentEvent({
          case_id: caseId,
          investigation_id: investigation.id,
          event_type: 'agent_replanned',
          headline: 'Investigation Plan Revised',
          description: plan.replan_reason,
        });
        onProgress?.(replanEvt);

        await db.addInvestigationStep({
          investigation_id: investigation.id,
          step_order: nextStepOrder + 1,
          phase: 'replan',
          action_name: 'Replan Query Strategy',
          reasoning: plan.replan_reason,
        });
      }
    }

    // 2. Dispatch Allowlisted Tool to Adapter
    const toolMap: Record<string, string> = {
      search_shelter: 'mock_shelter',
      search_hospital: 'mock_hospital',
      search_helpline: 'mock_helpline',
      search_ngo: 'mock_ngo',
    };

    const adapterKey = toolMap[plan.recommended_tool] || 'mock_shelter';
    const adapter = sourceRegistry.getAdapter(adapterKey);

    const toolCallEvt = await db.addAgentEvent({
      case_id: caseId,
      investigation_id: investigation.id,
      event_type: 'tool_called',
      headline: `Tool Dispatched: ${plan.recommended_tool}`,
      description: `Target: ${adapter?.name || adapterKey}. Query parameters: ${JSON.stringify(plan.tool_parameters)}`,
      payload: plan.tool_parameters,
    });
    onProgress?.(toolCallEvt);

    await db.addInvestigationStep({
      investigation_id: investigation.id,
      step_order: nextStepOrder + (plan.reflection ? 2 : 0),
      phase: 'tool_call',
      action_name: `Execute ${plan.recommended_tool}`,
      tool_name: plan.recommended_tool,
      tool_input: plan.tool_parameters,
      reasoning: plan.thought_process,
    });

    let recordsFound: SourceRecord[] = [];
    if (adapter) {
      recordsFound = await adapter.search({
        district: (plan.tool_parameters.district as string) || personCase.district,
        wristband_tag: plan.tool_parameters.wristband_tag as string,
        gender: personCase.gender,
      });
    }

    const toolResultEvt = await db.addAgentEvent({
      case_id: caseId,
      investigation_id: investigation.id,
      event_type: 'tool_result',
      headline: `Tool Result: ${recordsFound.length} Records Normalized`,
      description: `Retrieved records from ${adapter?.name || 'source'}. Proceeding to deterministic verification.`,
      payload: { count: recordsFound.length },
    });
    onProgress?.(toolResultEvt);

    // 3. Deterministic Verification & Contradiction Check
    let newCandidatesCount = 0;
    let contradictionsFound = 0;

    for (const record of recordsFound) {
      // Check if candidate already exists
      const existingCand = existingCandidates.find(
        (c) => c.source_record_id === record.id || c.candidate_code === record.external_id
      );

      // Check contradictions against other known records
      let recordContradictions: Contradiction[] = [];
      for (const other of existingRecords) {
        const contra = detectContradictionBetweenRecords(record, other);
        if (contra) {
          recordContradictions.push(contra);
          contradictionsFound++;

          const contraEvt = await db.addAgentEvent({
            case_id: caseId,
            investigation_id: investigation.id,
            event_type: 'contradiction_detected',
            headline: contra.title,
            description: `Distance: ${contra.distance_km}km in ${contra.time_diff_minutes}min => Speed: ${contra.required_speed_kmh}km/h (Limit: ${contra.speed_threshold_kmh}km/h).`,
            payload: { ...contra } as unknown as Record<string, unknown>,
          });
          onProgress?.(contraEvt);
        }
      }

      const hasContra = recordContradictions.length > 0;
      const score = calculateDeterministicScore(personCase, record, hasContra);

      if (!existingCand) {
        const cand = await db.createCandidate({
          case_id: caseId,
          source_record_id: record.id,
          candidate_code: record.external_id,
          source_type: record.source_type,
          source_name: record.source_name,
          match_score: score.total,
          score_breakdown: score,
          has_contradictions: hasContra,
          contradictions_count: recordContradictions.length,
          contradictions: recordContradictions,
          status: 'under_review',
          data_origin: 'synthetic',
        });
        existingCandidates.push(cand);
        existingRecords.push(record);
        newCandidatesCount++;

        const scoreEvt = await db.addAgentEvent({
          case_id: caseId,
          investigation_id: investigation.id,
          event_type: 'score_calculated',
          headline: `Candidate ${cand.candidate_code} Scored: ${cand.match_score}%`,
          description: `Deterministic verification: Age (+${score.age_compat}), Location (+${score.location}), Clothing (+${score.clothing}), Marks (+${score.marks}), Name (+${score.name_similarity})${hasContra ? ', Contradiction Penalty (-25)' : ''}.`,
          payload: { score: cand.match_score },
        });
        onProgress?.(scoreEvt);
      }
    }

    // 4. Update Investigation Summary & State
    const allCandidates = await db.getCandidates(caseId);
    const finalState = plan.handoff_to_human_reviewer
      ? 'awaiting_human_review'
      : plan.reflection
      ? 'needs_reassessment'
      : 'in_progress';

    investigation = await db.createOrUpdateInvestigation({
      case_id: caseId,
      state: finalState,
      current_phase: plan.handoff_to_human_reviewer ? 'human_review' : 'evidence_collection',
      summary: plan.thought_process,
      total_candidates: allCandidates.length,
      verified_candidates: allCandidates.filter((c) => c.match_score >= 50).length,
      flagged_contradictions: allCandidates.reduce((acc, c) => acc + (c.contradictions_count || 0), 0),
    });

    if (plan.handoff_to_human_reviewer) {
      const reviewEvt = await db.addAgentEvent({
        case_id: caseId,
        investigation_id: investigation.id,
        event_type: 'human_review_requested',
        headline: 'Case Escalated to Human Review Desk',
        description: 'System principle enforced: "The LLM reasons. The system verifies. The human decides."',
      });
      onProgress?.(reviewEvt);

      await db.updateCase(caseId, { status: 'awaiting_review' });
    }

    return {
      investigation,
      isComplete: plan.is_investigation_complete || plan.handoff_to_human_reviewer,
    };
  }

  /**
   * Run the full pipeline through all phases until ready for human review
   */
  async runFullInvestigation(
    caseId: string,
    onStep?: (event: AgentEvent) => void,
    delayMs = 600
  ): Promise<Investigation> {
    let completed = false;
    let iterations = 0;
    let currentInv: Investigation | null = null;

    while (!completed && iterations < 5) {
      iterations++;
      const result = await this.executeNextStep(caseId, onStep);
      currentInv = result.investigation;
      completed = result.isComplete;
      if (!completed && delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    return currentInv || (await db.getInvestigationByCaseId(caseId))!;
  }
}

export const investigationService = new InvestigationService();
