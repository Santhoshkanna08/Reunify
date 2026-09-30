// REUNIFY Human Review Desk
// "THE LLM REASONS. THE SYSTEM VERIFIES. THE HUMAN DECIDES."
// Official forensic confirmation and decision sign-off.

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Shield,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  Building2,
  Stethoscope,
  Shirt,
  Compass,
} from 'lucide-react';
import { db } from '../../lib/supabaseClient';
import { MissingPersonCase, Candidate, ReviewAction } from '../../types';
import { useAuth } from '../../lib/authContext';

interface ReviewPageProps {
  initialCaseId?: string;
  onNavigate: (tab: string, caseId?: string) => void;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({ initialCaseId, onNavigate }) => {
  const { currentUser, role } = useAuth();
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId || 'case-arun-001');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [rationale, setRationale] = useState('');
  const [confidence, setConfidence] = useState<'high' | 'moderate' | 'low'>('high');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDecision, setSubmittedDecision] = useState<string | null>(null);

  const loadData = async () => {
    const allCases = await db.getCases();
    setCases(allCases);

    const activeId = selectedCaseId || (allCases[0]?.id ?? '');
    if (activeId) {
      const cands = await db.getCandidates(activeId);
      setCandidates(cands);
      if (cands.length > 0 && !selectedCandidateId) {
        setSelectedCandidateId(cands[0].id);
      }
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('reunify_data_changed', loadData);
    return () => window.removeEventListener('reunify_data_changed', loadData);
  }, [selectedCaseId]);

  const activeCase = cases.find((c) => c.id === selectedCaseId);
  const activeCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  const handleDecision = async (action: ReviewAction) => {
    if (!activeCase || !activeCandidate) return;
    if (!rationale.trim()) {
      alert('A formal rationale is required for the immutable supervisory audit log.');
      return;
    }

    setIsSubmitting(true);
    try {
      await db.createReviewDecision({
        case_id: activeCase.id,
        candidate_id: activeCandidate.id,
        reviewer_name: currentUser.full_name,
        reviewer_id: currentUser.id,
        action,
        confidence_level: confidence,
        rationale: rationale.trim(),
        required_followup: action === 'request_more_evidence' ? 'Field officer physical interview requested' : undefined,
      });

      setSubmittedDecision(action);
      setRationale('');
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Failed to submit decision: ' + (e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Human Review & Supervisory Desk
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              Forensic Oversight
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate algorithmically reconciled evidence dossiers. Certified human decision is mandatory.
          </p>
        </div>

        {/* Case Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-600">Active Case:</label>
          <select
            value={selectedCaseId}
            onChange={(e) => {
              setSelectedCaseId(e.target.value);
              setSelectedCandidateId('');
              setSubmittedDecision(null);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} - {c.full_name} ({c.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mandatory Human Review Warning Banner */}
      <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
              AI-assisted result. Human confirmation required.
            </span>
            <p className="text-xs text-amber-800 mt-0.5">
              The AI investigation pipeline and deterministic scorer recommend candidates based on available records,
              but <strong>cannot legally or ethically declare an official reunification</strong> without certified human review.
            </p>
          </div>
        </div>
        <span className="hidden md:inline-block font-mono text-xs font-bold bg-white text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200 shrink-0">
          Reviewer: {currentUser.full_name}
        </span>
      </div>

      {submittedDecision && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Decision <strong>{submittedDecision.toUpperCase()}</strong> successfully committed to database and logged in the immutable audit trail.
            </span>
          </div>
          <button
            onClick={() => setSubmittedDecision(null)}
            className="font-bold underline text-emerald-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Candidate Selector Pills */}
      {candidates.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Candidates ({candidates.length}):</span>
          {candidates.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCandidateId(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
                activeCandidate?.id === c.id
                  ? 'bg-[#0F2942] text-white border-transparent shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{c.candidate_code}</span>
              <span className="ml-1.5 opacity-75">({c.match_score}%)</span>
              {c.has_contradictions && <span className="ml-1 text-amber-400">⚠️</span>}
            </button>
          ))}
        </div>
      )}

      {/* Side-by-Side Comparison: Missing Person Dossier vs Candidate Dossier */}
      {activeCase && activeCandidate ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Missing Person Report */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Missing Person Dossier
              </span>
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                {activeCase.case_number}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                {activeCase.photo_url ? (
                  <img src={activeCase.photo_url} alt={activeCase.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                    {activeCase.full_name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{activeCase.full_name}</h3>
                <span className="text-xs text-slate-500 font-medium">
                  {activeCase.age} yrs • {activeCase.gender} • {activeCase.district}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Last seen: {activeCase.last_seen_date} at {activeCase.last_seen_time}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Reported Clothing</span>
                <span className="font-semibold text-slate-800">{activeCase.clothing_description}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Reported Anatomical Markers</span>
                <span className="font-semibold text-slate-800">{activeCase.distinguishing_marks}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Known Landmark</span>
                <span className="font-semibold text-slate-800">{activeCase.last_known_location}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Medical Conditions</span>
                <span className="text-slate-800">{activeCase.medical_conditions || 'None reported'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Matched Candidate Record */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Reconciled Candidate Intake
              </span>
              <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                {activeCandidate.candidate_code} • {activeCandidate.source_name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase block">Source Record ID</span>
                <h3 className="text-lg font-bold text-slate-900">{activeCandidate.candidate_code}</h3>
                <span className="text-xs text-slate-500 capitalize">Type: {activeCandidate.source_type}</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Deterministic Score
                </span>
                <span className="text-3xl font-black text-teal-700">{activeCandidate.match_score}%</span>
              </div>
            </div>

            {/* Contradiction Warning */}
            {activeCandidate.has_contradictions && activeCandidate.contradictions && (
              <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-900 space-y-1">
                <div className="flex items-center font-bold text-rose-800">
                  <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-600" />
                  Spatiotemporal Contradiction Detected
                </div>
                <p className="text-[11px] leading-relaxed">
                  Record implies travel velocity of{' '}
                  <strong>{activeCandidate.contradictions[0].required_speed_kmh} km/h</strong> between{' '}
                  {activeCandidate.contradictions[0].sourceA.location} and{' '}
                  {activeCandidate.contradictions[0].sourceB.location}.
                </p>
                <span className="text-[10px] text-rose-700 block italic">
                  Reviewer must evaluate if this is an intake time clerical lag or wristband misassignment.
                </span>
              </div>
            )}

            {/* Candidate Normalized Attributes */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                <span className="text-[10px] uppercase font-bold text-teal-800 block">Recorded Clothing</span>
                <span className="font-semibold text-slate-800">
                  {activeCandidate.source_record?.clothing_summary || 'Unrecorded upon intake'}
                </span>
              </div>

              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                <span className="text-[10px] uppercase font-bold text-teal-800 block">Recorded Anatomical Marks</span>
                <span className="font-semibold text-slate-800">
                  {activeCandidate.source_record?.identifying_marks || 'No marks cataloged'}
                </span>
              </div>

              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                <span className="text-[10px] uppercase font-bold text-teal-800 block">Current Triage Location</span>
                <span className="font-semibold text-slate-800">
                  {activeCandidate.source_record?.location_name || activeCandidate.source_name} (
                  {activeCandidate.source_record?.district || 'Tamil Nadu'})
                </span>
              </div>

              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                <span className="text-[10px] uppercase font-bold text-teal-800 block">Admittee Status / Wristband</span>
                <span className="font-mono text-slate-800">
                  Wristband Tag: {activeCandidate.source_record?.wristband_tag || 'None'} • Condition:{' '}
                  {activeCandidate.source_record?.status_condition || 'Stable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs">
          No candidates available for review on this case.
        </div>
      )}

      {/* Reviewer Action Sign-Off Panel */}
      {activeCandidate && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Official Supervisory Action & Sign-Off</h3>
            <p className="text-xs text-slate-500">
              Provide formal rationale and confidence level before authorizing case closure or requesting field verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reviewer Confidence Level *</label>
              <select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="high">High Confidence (Consistent biometric & contextual tokens)</option>
                <option value="moderate">Moderate Confidence (Plausible match, minor discrepancy)</option>
                <option value="low">Low Confidence (Disputed tokens or unresolved contradiction)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Supervisory Rationale / Justification *
              </label>
              <input
                type="text"
                placeholder="e.g. Scars on left hand match precisely; wristband speed anomaly resolved as clerical intake delay."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            {/* Request more evidence */}
            <button
              onClick={() => handleDecision('request_more_evidence')}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition disabled:opacity-50"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Request More Field Evidence</span>
            </button>

            {/* Reject Match */}
            <button
              onClick={() => handleDecision('reject')}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold text-xs transition disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Reject Match</span>
            </button>

            {/* Approve Match */}
            <button
              onClick={() => handleDecision('approve')}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Official Reunification</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
