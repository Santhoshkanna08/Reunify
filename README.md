# REUNIFY — Missing Persons & Family Reunification

> **"Reconnect people. Reconcile evidence. Restore certainty."**  
> *HackSprint '26 • Challenge DM-05: Missing Persons & Family Reunification*

---

## 1. Overview & Core Philosophy

After disasters, missing-person information is fragmented across shelters, hospitals, helplines, NGOs, and field rescue teams. **REUNIFY** reconciles available evidence, identifies possible matches, detects spatiotemporal contradictions (such as physical travel impossibilities or duplicate wristband issuances), updates candidates dynamically as new evidence arrives, and enforces certified human review before any match is confirmed.

### Core Principle
```
┌─────────────────┐       ┌────────────────────┐       ┌────────────────────┐
│ THE LLM REASONS │  ──>  │ THE SYSTEM VERIFIES │  ──>  │  THE HUMAN DECIDES  │
└─────────────────┘       └────────────────────┘       └────────────────────┘
```
- **The LLM is NOT an oracle:** It does not assign match scores, calculate probabilities, or directly declare identities.
- **The System Verifies:** All scoring is calculated by an explicit deterministic mathematical engine (ID match +30, Age ±2 yrs +15, District +15, Time chronology +10, Clothing +10, Marks +15, Name up to +20, Contradiction penalty -25).
- **The Human Decides:** An authorized human reviewer inspects the evidence dossier, reviews contradiction hypotheses, and signs off.

---

## 2. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, Motion.
- **Backend / Database:** FastAPI Python backend. Data is temporarily stored via a high-fidelity in-memory storage engine across both backend and frontend layers to allow standalone testing prior to the Supabase PostgreSQL migration.
- **AI & Reasoning:** Modern Gemini API abstraction layer + deterministic fallback planner with allowlisted tools (`search_shelter`, `search_hospital`, `search_helpline`, `search_ngo`).
- **Data Protection:** Personally Identifiable Information (PII) masking (`maskPhoneNumber`, `maskEmail`) across all public views.

---

## 3. Environment Variables (`.env.example`)

Copy `.env.example` to `.env`:

```bash
# Gemini AI API Key (Server-side injected in AI Studio)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Application URL
APP_URL="http://localhost:3000"

# Supabase Credentials (Optional for cloud sync; system has persistent in-browser database engine fallback)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

---

## 4. Current State: In-Memory Database

**IMPORTANT**: Supabase is NOT yet connected. The current project architecture uses an entirely in-memory database (`backend/database/supabase.py` and `src/lib/supabaseClient.ts`) to ensure the application logic is hackathon-ready and fully testable without external dependencies. All cases, investigation steps, and candidate scores are stored in-memory and will reset upon restarting the backend or frontend servers.

The full PostgreSQL DDL schema with RLS policies, enums, indexes, and triggers is located at `/supabase/migrations/20260101000000_reunify_schema.sql` for the future migration phase.

---

## 5. Seed Data & The Arun Madurai Scenario

All sample records are explicitly tagged `data_origin = "synthetic"`.

### The Arun Case Scenario:
- **Missing Person:** Arun Kumar, Age 22, Male, Last seen Sellur Vaigai Bank, Madurai at 7:30 PM. Royal blue shirt, surgical scar on back of left hand.
- **Candidate SH-007 (Shelter):** Sellur Relief Camp, Madurai at 8:10 PM. Age 23, blue shirt, matching scar on left hand. Initial match score **85%**.
- **Candidate HP-015 (Hospital):** GRH Madurai at 9:00 PM. Weak initial match (45%).
- **Candidate HP-099 (Hospital - Contradiction):** Theni Hospital at 7:45 PM with wristband `WB-1842`.
  - **Spatiotemporal Calculation:** Madurai to Theni is **75.2 km**. Time elapsed between 7:45 PM and 8:10 PM is **25 minutes**.
  - **Required Speed:** $75.2\text{ km} / (25/60\text{ h}) = \mathbf{180.5\text{ km/h}}$.
  - **Physical Contradiction:** Transit velocity is physically impossible in flood conditions.
  - **Penalty:** Score penalized by **-25 points**.
  - **Agent Reflection:** Agent notes probable duplicate wristband batch or data entry lag; does not invalidate SH-007 physical traits; pauses automatic conclusions and routes to **Human Review Desk**.

---

## 6. Source-Integration Architecture (Adapters)

External institutional systems connect through the modular `SourceAdapter` interface in `src/services/adapters/SourceAdapter.ts`:

```typescript
export interface SourceAdapter {
  sourceType: SourceType;
  adapterKey: string;
  name: string;
  search(query: SearchQuery): Promise<SourceRecord[]>;
  getRecord(id: string): Promise<SourceRecord | null>;
  healthCheck(): Promise<HealthStatus>;
  normalizeRecord(raw: unknown): Partial<SourceRecord>;
}
```

### Future Institutional Connectors
To replace `MockHospitalAdapter` with a live hospital network:
1. Create `HospitalAPIAdapter.ts` implementing `SourceAdapter`.
2. Connect to state FHIR/HL7 or REST endpoints via server proxy.
3. Register in `SourceAdapterRegistry.register(new HospitalAPIAdapter())`.
4. The investigation UI and verification engine require zero changes.

---

## 7. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run dev server on port 3000
npm run dev

# 3. Type check & build
npm run build
```

---

## 8. User Journeys Implemented

1. **Public Reporter Journey:**
   - Home Page → "Report Missing Person" → 5-step guided wizard (Basic info, Appearance, Contact, Review, Submit) → Case created in database → Instant Case ID generated (e.g. `CASE-2026-0842`) → Secure tracking link.
2. **Public Tracking Journey:**
   - `/track` → Enter Case ID → View verified milestones, candidate count, and review state without exposing clinical or personal PII.
3. **Investigator Autonomous Cockpit Journey:**
   - Open case → Click "Start Investigation" / "Continue Investigation" → LLM plans next step → Chooses allowlisted tool (`search_shelter`, etc.) → Normalizes records → Deterministic scoring (+15 age, +15 district, +15 scars, etc.) → Contradiction detected → Agent enters `needs_reassessment` reflection state → Re-plans and branches query → Escalates to Human Review.
4. **Human Reviewer Journey:**
   - `/review` → Side-by-side comparison of missing person vs candidate record → Inspects contradiction math (180 km/h velocity impossibility) → Selects confidence → Submits mandatory rationale → Approves or rejects → Record committed to `review_decisions` and immutable `audit_logs`.
