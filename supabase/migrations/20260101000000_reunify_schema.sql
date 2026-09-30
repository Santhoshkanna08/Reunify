-- ====================================================================
-- REUNIFY PostgreSQL Schema & Row-Level Security
-- HackSprint '26 DM-05: Missing Persons & Family Reunification
-- "Reconnect people. Reconcile evidence. Restore certainty."
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('public', 'reporter', 'investigator', 'reviewer', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE case_status AS ENUM ('submitted', 'under_investigation', 'candidate_found', 'awaiting_review', 'reunited', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('shelter', 'hospital', 'helpline', 'ngo', 'transport', 'registry');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE candidate_status AS ENUM ('new', 'investigating', 'under_review', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE review_action AS ENUM ('approve', 'reject', 'request_more_evidence', 'further_review');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. USER PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role DEFAULT 'investigator',
  badge_number TEXT,
  agency TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MISSING PERSONS & CASES
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY DEFAULT ('case-' || substr(uuid_generate_v4()::text, 1, 8)),
  case_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'submitted',
  priority TEXT DEFAULT 'high',
  full_name TEXT NOT NULL,
  alias TEXT,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  last_known_location TEXT NOT NULL,
  district TEXT NOT NULL,
  last_seen_date DATE NOT NULL,
  last_seen_time TIME,
  clothing_description TEXT,
  height_cm INTEGER,
  distinguishing_marks TEXT,
  medical_conditions TEXT,
  wristband_tag TEXT,
  photo_url TEXT,
  reporter_name TEXT NOT NULL,
  reporter_relationship TEXT NOT NULL,
  reporter_phone TEXT NOT NULL,
  reporter_email TEXT,
  data_origin TEXT DEFAULT 'synthetic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_district ON cases(district);
CREATE INDEX IF NOT EXISTS idx_cases_full_name ON cases USING gin (full_name gin_trgm_ops);

-- 5. SHELTER RECORDS
CREATE TABLE IF NOT EXISTS shelter_records (
  id TEXT PRIMARY KEY DEFAULT ('rec-sh-' || substr(uuid_generate_v4()::text, 1, 8)),
  external_id TEXT NOT NULL,
  case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
  source_type TEXT DEFAULT 'shelter',
  source_name TEXT NOT NULL,
  person_name TEXT,
  estimated_age INTEGER,
  gender TEXT,
  location_name TEXT NOT NULL,
  district TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  clothing_summary TEXT,
  identifying_marks TEXT,
  wristband_tag TEXT,
  status_condition TEXT,
  raw_payload JSONB DEFAULT '{}',
  data_origin TEXT DEFAULT 'synthetic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shelter_district ON shelter_records(district);
CREATE INDEX IF NOT EXISTS idx_shelter_wristband ON shelter_records(wristband_tag);
CREATE INDEX IF NOT EXISTS idx_shelter_case_id ON shelter_records(case_id);

-- 6. HOSPITAL RECORDS
CREATE TABLE IF NOT EXISTS hospital_records (
  id TEXT PRIMARY KEY DEFAULT ('rec-hp-' || substr(uuid_generate_v4()::text, 1, 8)),
  external_id TEXT NOT NULL,
  case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
  source_type TEXT DEFAULT 'hospital',
  source_name TEXT NOT NULL,
  person_name TEXT,
  estimated_age INTEGER,
  gender TEXT,
  location_name TEXT NOT NULL,
  district TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  clothing_summary TEXT,
  identifying_marks TEXT,
  wristband_tag TEXT,
  status_condition TEXT,
  raw_payload JSONB DEFAULT '{}',
  data_origin TEXT DEFAULT 'synthetic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospital_district ON hospital_records(district);
CREATE INDEX IF NOT EXISTS idx_hospital_wristband ON hospital_records(wristband_tag);
CREATE INDEX IF NOT EXISTS idx_hospital_case_id ON hospital_records(case_id);

-- 7. HELPLINE RECORDS
CREATE TABLE IF NOT EXISTS helpline_records (
  id TEXT PRIMARY KEY DEFAULT ('rec-hl-' || substr(uuid_generate_v4()::text, 1, 8)),
  external_id TEXT NOT NULL,
  case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
  source_type TEXT DEFAULT 'helpline',
  source_name TEXT NOT NULL,
  person_name TEXT,
  estimated_age INTEGER,
  gender TEXT,
  location_name TEXT NOT NULL,
  district TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  clothing_summary TEXT,
  identifying_marks TEXT,
  wristband_tag TEXT,
  status_condition TEXT,
  raw_payload JSONB DEFAULT '{}',
  data_origin TEXT DEFAULT 'synthetic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_helpline_district ON helpline_records(district);
CREATE INDEX IF NOT EXISTS idx_helpline_wristband ON helpline_records(wristband_tag);
CREATE INDEX IF NOT EXISTS idx_helpline_case_id ON helpline_records(case_id);

-- 8. UNIFIED SOURCE RECORDS (For general lookup & compatibility)
CREATE TABLE IF NOT EXISTS source_records (
  id TEXT PRIMARY KEY DEFAULT ('rec-' || substr(uuid_generate_v4()::text, 1, 8)),
  external_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  person_name TEXT,
  estimated_age INTEGER,
  gender TEXT,
  location_name TEXT NOT NULL,
  district TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  clothing_summary TEXT,
  identifying_marks TEXT,
  wristband_tag TEXT,
  status_condition TEXT,
  contact_officer TEXT,
  raw_payload JSONB DEFAULT '{}',
  data_origin TEXT DEFAULT 'synthetic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_source_records_district ON source_records(district);
CREATE INDEX IF NOT EXISTS idx_source_records_wristband ON source_records(wristband_tag);

-- 9. CANDIDATE MATCHES
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY DEFAULT ('cand-' || substr(uuid_generate_v4()::text, 1, 8)),
  case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
  source_record_id TEXT,
  candidate_code TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  match_score NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  has_contradictions BOOLEAN DEFAULT FALSE,
  contradictions_count INTEGER DEFAULT 0,
  contradiction_details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new',
  data_origin TEXT DEFAULT 'synthetic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_case_id ON candidates(case_id);
CREATE INDEX IF NOT EXISTS idx_candidates_score ON candidates(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_code ON candidates(candidate_code);

-- 10. CANDIDATE EVIDENCE ITEMS
CREATE TABLE IF NOT EXISTS candidate_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  points_awarded NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  is_contradiction BOOLEAN DEFAULT FALSE,
  severity TEXT DEFAULT 'info',
  metadata JSONB DEFAULT '{}',
  data_origin TEXT DEFAULT 'synthetic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INVESTIGATION STEPS & AGENT WORKFLOW
CREATE TABLE IF NOT EXISTS investigation_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
  step_order INTEGER DEFAULT 1,
  cycle_number INTEGER DEFAULT 1,
  phase TEXT NOT NULL,
  action_name TEXT NOT NULL,
  tool_name TEXT,
  tool_input JSONB DEFAULT '{}',
  tool_output JSONB DEFAULT '{}',
  reasoning TEXT,
  reflection_notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_steps_case_id ON investigation_steps(case_id);
CREATE INDEX IF NOT EXISTS idx_steps_created_at ON investigation_steps(created_at);

-- 12. CONTRADICTIONS
CREATE TABLE IF NOT EXISTS contradictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
  candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
  source_a TEXT NOT NULL,
  source_b TEXT NOT NULL,
  required_speed_kmh NUMERIC(8,2),
  possible_explanations JSONB DEFAULT '[]',
  location_data_insufficient BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contradictions_case_id ON contradictions(case_id);

-- 13. HUMAN REVIEW DECISIONS
CREATE TABLE IF NOT EXISTS human_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  action TEXT NOT NULL,
  confidence_level TEXT NOT NULL,
  rationale TEXT NOT NULL,
  required_followup TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_human_decisions_case_id ON human_decisions(case_id);
CREATE INDEX IF NOT EXISTS idx_human_decisions_cand_id ON human_decisions(candidate_id);

-- 14. AUDIT LOGS (Immutable audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('audit-' || substr(uuid_generate_v4()::text, 1, 8)),
  case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
  phase TEXT,
  actor TEXT NOT NULL,
  actor_name TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT DEFAULT 'case',
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  payload JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_case_id ON audit_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 15. PENDING INJECTIONS
CREATE TABLE IF NOT EXISTS pending_injections (
  id TEXT PRIMARY KEY DEFAULT ('pend-' || substr(uuid_generate_v4()::text, 1, 8)),
  case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
  pending_id TEXT UNIQUE NOT NULL,
  injection_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  applied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pending_injections_case ON pending_injections(case_id);
CREATE INDEX IF NOT EXISTS idx_pending_injections_id ON pending_injections(pending_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelter_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE helpline_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_injections ENABLE ROW LEVEL SECURITY;

-- Backend Service Role / Authenticated policies
CREATE POLICY "Public case submission" ON cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Public case read" ON cases FOR SELECT USING (true);
CREATE POLICY "Investigator case management" ON cases FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Shelter read" ON shelter_records FOR SELECT USING (true);
CREATE POLICY "Shelter write" ON shelter_records FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Hospital read" ON hospital_records FOR SELECT USING (true);
CREATE POLICY "Hospital write" ON hospital_records FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Helpline read" ON helpline_records FOR SELECT USING (true);
CREATE POLICY "Helpline write" ON helpline_records FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Candidates investigator read" ON candidates FOR SELECT USING (true);
CREATE POLICY "Candidates investigator write" ON candidates FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Steps read" ON investigation_steps FOR SELECT USING (true);
CREATE POLICY "Steps write" ON investigation_steps FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Audit logs insert" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Audit logs read" ON audit_logs FOR SELECT USING (true);

CREATE POLICY "Decisions read" ON human_decisions FOR SELECT USING (true);
CREATE POLICY "Decisions write" ON human_decisions FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
