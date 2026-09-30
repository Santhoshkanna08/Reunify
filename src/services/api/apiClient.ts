/**
 * REUNIFY FastAPI Client
 * Communicates with FastAPI backend for investigation operations,
 * allowlisted tool execution, evidence injection, and supervisory human review.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export interface DecisionPayload {
  reviewer_name: string;
  action: 'approve' | 'reject' | 'further_review';
  rationale: string;
  confidence_level?: string;
}

export async function checkBackendHealth(): Promise<{ status: string; service: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline / not started
  }
  return { status: "offline", service: "FastAPI" };
}

export async function apiListCases(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/cases`);
  if (!res.ok) throw new Error(`Failed to list cases: ${res.statusText}`);
  return await res.json();
}

export async function apiCreateCase(caseData: any): Promise<any> {
  const res = await fetch(`${API_BASE}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(caseData),
  });
  if (!res.ok) throw new Error(`Failed to create case: ${res.statusText}`);
  return await res.json();
}

export async function apiGetCaseDetail(caseId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/cases/${caseId}`);
  if (!res.ok) throw new Error(`Failed to fetch case: ${res.statusText}`);
  return await res.json();
}

export async function apiRunInvestigation(caseId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/investigate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Investigation failed: ${res.statusText}`);
  return await res.json();
}

export async function apiInjectPendingRecord(caseId: string, pendingId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/inject/${pendingId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Record injection failed: ${res.statusText}`);
  return await res.json();
}

export async function apiGetCandidates(caseId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/candidates`);
  if (!res.ok) throw new Error(`Failed to fetch candidates: ${res.statusText}`);
  return await res.json();
}

export async function apiGetAuditTrail(caseId?: string): Promise<any[]> {
  const url = caseId ? `${API_BASE}/cases/${caseId}/audit` : `${API_BASE}/cases/case-001/audit`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch audit: ${res.statusText}`);
  return await res.json();
}

export async function apiSubmitDecision(candidateId: string, payload: DecisionPayload): Promise<any> {
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Decision submission failed: ${res.statusText}`);
  return await res.json();
}
