// REUNIFY Core TypeScript Definitions
// "Reconnect people. Reconcile evidence. Restore certainty."

export type UserRole = 'public' | 'reporter' | 'investigator' | 'reviewer' | 'admin';

export type CaseStatus =
  | 'submitted'
  | 'under_investigation'
  | 'candidate_found'
  | 'awaiting_review'
  | 'reunited'
  | 'closed';

export type SourceType = 'shelter' | 'hospital' | 'helpline' | 'ngo' | 'transport' | 'registry';

export type CandidateStatus = 'new' | 'investigating' | 'under_review' | 'approved' | 'rejected';

export type ReviewAction = 'approve' | 'reject' | 'request_more_evidence';

export type Severity = 'info' | 'medium' | 'high' | 'critical';

export interface Profile {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  role: UserRole;
  badge_number?: string;
  agency?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface MissingPersonCase {
  id: string;
  case_number: string;
  status: CaseStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  full_name: string;
  alias?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Unknown';
  last_known_location: string;
  district: string;
  last_seen_date: string;
  last_seen_time: string;
  clothing_description: string;
  height_cm?: number;
  distinguishing_marks: string;
  wristband_tag?: string;
  medical_conditions?: string;
  photo_url?: string;
  reporter_name: string;
  reporter_relationship: string;
  reporter_phone: string;
  reporter_email?: string;
  data_origin: 'synthetic' | 'live' | 'imported';
  created_at: string;
  updated_at: string;
}

export interface SourceConnection {
  id: string;
  name: string;
  source_type: SourceType;
  adapter_key: string;
  endpoint_url: string;
  status: 'active' | 'degraded' | 'offline' | 'simulation';
  is_enabled: boolean;
  records_count: number;
  last_synced_at: string;
  config: Record<string, unknown>;
  data_origin: 'synthetic' | 'live';
  created_at: string;
  updated_at: string;
}

export interface SourceRecord {
  id: string;
  connection_id?: string;
  external_id: string;
  source_type: SourceType;
  source_name: string;
  person_name?: string;
  estimated_age?: number;
  gender?: string;
  location_name: string;
  district: string;
  recorded_at: string; // ISO timestamp
  clothing_summary?: string;
  identifying_marks?: string;
  wristband_tag?: string;
  status_condition?: string;
  contact_officer?: string;
  raw_payload?: Record<string, unknown>;
  data_origin: 'synthetic' | 'live';
  created_at: string;
  updated_at: string;
}

export interface ScoreBreakdown {
  id_match: number;        // max +30
  age_compat: number;      // max +15 (within ±2 yrs)
  location: number;        // max +15 (same district)
  time: number;            // max +10 (temporally feasible)
  clothing: number;        // max +10
  marks: number;           // max +15
  name_similarity: number; // max +20
  contradiction_penalty: number; // -25 each contradiction
  total: number;           // Sum clamped to 0..100
  notes: string[];
}

export interface Contradiction {
  id: string;
  title: string;
  sourceA: { name: string; location: string; time: string; external_id: string };
  sourceB: { name: string; location: string; time: string; external_id: string };
  distance_km: number;
  time_diff_minutes: number;
  required_speed_kmh: number;
  speed_threshold_kmh: number;
  severity: Severity;
  possible_explanations: string[];
  requires_human_review: boolean;
}

export interface CandidateEvidenceItem {
  id: string;
  candidate_id: string;
  evidence_type: 'id_match' | 'age_compat' | 'location' | 'time' | 'clothing' | 'marks' | 'name' | 'contradiction';
  title: string;
  details: string;
  points_awarded: number;
  is_contradiction: boolean;
  severity: Severity;
  metadata?: Record<string, unknown>;
  data_origin: 'synthetic' | 'live';
  created_at: string;
}

export interface Candidate {
  id: string;
  case_id: string;
  source_record_id: string;
  candidate_code: string; // e.g. SH-007, HP-099
  source_type: SourceType;
  source_name: string;
  match_score: number; // 0 - 100 Evidence-based match score
  score_breakdown: ScoreBreakdown;
  has_contradictions: boolean;
  contradictions_count: number;
  contradictions?: Contradiction[];
  status: CandidateStatus;
  data_origin: 'synthetic' | 'live';
  created_at: string;
  updated_at: string;
  source_record?: SourceRecord;
}

export interface Investigation {
  id: string;
  case_id: string;
  lead_investigator_id?: string;
  state: 'in_progress' | 'needs_reassessment' | 'paused' | 'awaiting_human_review' | 'completed';
  current_phase: 'evidence_collection' | 'cross_source_verification' | 'contradiction_reflection' | 'human_review';
  summary: string;
  total_candidates: number;
  verified_candidates: number;
  flagged_contradictions: number;
  data_origin: 'synthetic' | 'live';
  created_at: string;
  updated_at: string;
}

export interface InvestigationStep {
  id: string;
  investigation_id: string;
  step_order: number;
  phase: 'plan' | 'tool_call' | 'tool_result' | 'verify' | 'reflect' | 'replan';
  action_name: string;
  tool_name?: 'search_shelter' | 'search_hospital' | 'search_helpline' | 'search_ngo';
  tool_input?: Record<string, unknown>;
  tool_output?: Record<string, unknown>;
  reasoning: string;
  reflection_notes?: string;
  created_at: string;
}

export interface AgentEvent {
  id: string;
  case_id: string;
  investigation_id: string;
  event_type:
    | 'agent_started'
    | 'tool_called'
    | 'tool_result'
    | 'score_calculated'
    | 'contradiction_detected'
    | 'agent_reflected'
    | 'agent_replanned'
    | 'human_review_requested';
  headline: string;
  description: string;
  payload?: Record<string, unknown>;
  created_at: string;
}

export interface ReviewDecision {
  id: string;
  case_id: string;
  candidate_id: string;
  reviewer_id?: string;
  reviewer_name: string;
  action: ReviewAction;
  confidence_level: 'high' | 'moderate' | 'low';
  rationale: string;
  required_followup?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  case_id?: string;
  actor_name: string;
  actor_role: UserRole;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  case_id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  is_read: boolean;
  created_at: string;
}

export interface SearchQuery {
  district?: string;
  estimated_age?: number;
  gender?: string;
  clothing_keywords?: string[];
  identifying_marks_keywords?: string[];
  name_keyword?: string;
  recorded_after?: string;
  wristband_tag?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unreachable';
  latency_ms: number;
  message?: string;
  lastChecked: string;
}

export interface SourceAdapter {
  sourceType: SourceType;
  adapterKey: string;
  name: string;
  search(query: SearchQuery): Promise<SourceRecord[]>;
  getRecord(id: string): Promise<SourceRecord | null>;
  healthCheck(): Promise<HealthStatus>;
  normalizeRecord(raw: unknown): Partial<SourceRecord>;
}
