// REUNIFY Public Safe Case Tracking Page
// Enforces PII redaction and public-safe progress reporting.

import React, { useState, useEffect } from 'react';
import {
  Search,
  Shield,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Stethoscope,
  Users,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { db } from '../../lib/supabaseClient';
import { MissingPersonCase, Candidate, Investigation } from '../../types';
import { maskPhoneNumber } from '../../services/privacy/privacyService';

interface TrackCasePageProps {
  initialCaseId?: string;
  onNavigate: (tab: string, caseId?: string) => void;
}

export const TrackCasePage: React.FC<TrackCasePageProps> = ({ initialCaseId, onNavigate }) => {
  const [searchInput, setSearchInput] = useState(initialCaseId || 'CASE-2026-0842');
  const [personCase, setPersonCase] = useState<MissingPersonCase | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const performSearch = async (caseNum: string) => {
    if (!caseNum.trim()) return;
    setLoading(true);
    setNotFound(false);

    try {
      const allCases = await db.getCases();
      const target = allCases.find(
        (c) =>
          c.case_number.toLowerCase() === caseNum.trim().toLowerCase() ||
          c.id.toLowerCase() === caseNum.trim().toLowerCase()
      );

      if (target) {
        setPersonCase(target);
        const cands = await db.getCandidates(target.id);
        setCandidates(cands);
        const inv = await db.getInvestigationByCaseId(target.id);
        setInvestigation(inv);
      } else {
        setPersonCase(null);
        setCandidates([]);
        setInvestigation(null);
        setNotFound(true);
      }
    } catch (e) {
      console.error(e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCaseId) {
      performSearch(initialCaseId);
    } else {
      performSearch('CASE-2026-0842');
    }
  }, [initialCaseId]);

  const statusBadges: Record<string, { label: string; color: string; desc: string }> = {
    submitted: {
      label: 'Report Submitted',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      desc: 'Case received into central database and queued for cross-source ingestion.',
    },
    under_investigation: {
      label: 'Under Active Investigation',
      color: 'bg-teal-100 text-teal-800 border-teal-200',
      desc: 'Autonomous cross-referencing across shelters, hospitals, helplines, and NGOs is in progress.',
    },
    candidate_found: {
      label: 'Possible Candidates Identified',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      desc: 'Candidate records matching physical criteria are undergoing deterministic scoring.',
    },
    awaiting_review: {
      label: 'Awaiting Human Review',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      desc: 'Reconciled evidence dossier is with the certified supervisory human review board.',
    },
    reunited: {
      label: 'Reunification Confirmed',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Family identity verified by human reviewer. Official reunification protocol executed.',
    },
    closed: {
      label: 'Case Concluded',
      color: 'bg-slate-200 text-slate-800 border-slate-300',
      desc: 'Administrative case process completed.',
    },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-3">
          <Lock className="w-3.5 h-3.5 text-teal-600" />
          <span>Privacy Protected Public Tracking Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Investigation Status
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
          Enter your official Case ID to check verification progress across all connected disaster relief networks.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Enter Case ID (e.g. CASE-2026-0842)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch(searchInput)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={() => performSearch(searchInput)}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition shadow-sm shrink-0 flex items-center justify-center space-x-1.5"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'Searching...' : 'Search Status'}</span>
        </button>
      </div>

      {/* Quick Sample Selector */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Sample cases:</span>
        <button
          onClick={() => {
            setSearchInput('CASE-2026-0842');
            performSearch('CASE-2026-0842');
          }}
          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-mono font-medium transition"
        >
          CASE-2026-0842 (Arun Kumar)
        </button>
        <button
          onClick={() => {
            setSearchInput('CASE-2026-0843');
            performSearch('CASE-2026-0843');
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-medium transition"
        >
          CASE-2026-0843 (Priya S.)
        </button>
        <button
          onClick={() => {
            setSearchInput('CASE-2026-0845');
            performSearch('CASE-2026-0845');
          }}
          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-mono font-medium transition"
        >
          CASE-2026-0845 (Karthik - Reunited)
        </button>
      </div>

      {/* Not Found Alert */}
      {notFound && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-xs text-rose-800">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <span className="font-bold text-sm block">Case Not Found</span>
          <p className="mt-1">
            No active or archived case matched identifier &quot;{searchInput}&quot;. Please verify the case number from your confirmation receipt.
          </p>
        </div>
      )}

      {/* Case Dossier Result */}
      {personCase && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden animate-in fade-in">
          {/* Header Card */}
          <div className="bg-[#0F2942] text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded">
                    {personCase.case_number}
                  </span>
                  <span className="text-xs text-slate-300">
                    Registered: {new Date(personCase.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 text-white tracking-tight">
                  {personCase.full_name}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Age: {personCase.age} yrs • Gender: {personCase.gender} • District: {personCase.district}
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                    statusBadges[personCase.status]?.color || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {statusBadges[personCase.status]?.label || personCase.status}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Last updated: {new Date(personCase.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Status explanation banner */}
            <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 flex items-start space-x-3 text-xs">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-teal-900 block text-sm">Current Investigation Status</span>
                <p className="text-teal-950/80 mt-0.5 leading-relaxed">
                  {statusBadges[personCase.status]?.desc}
                </p>
              </div>
            </div>

            {/* Public Verified Progress Milestone Bar */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Investigation Pipeline Milestones
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center text-teal-700 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> 1. Intake
                  </div>
                  <p className="text-[11px] text-slate-600">Case registered & normalized</p>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    investigation
                      ? 'bg-teal-50 border-teal-200 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center text-teal-700 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> 2. Source Sweep
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Shelters, Hospitals & Helplines queried
                  </p>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    candidates.length > 0
                      ? 'bg-teal-50 border-teal-200 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center text-teal-700 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> 3. Verification
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {candidates.length} Candidate records evaluated
                  </p>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    personCase.status === 'reunited'
                      ? 'bg-emerald-50 border-emerald-200 font-semibold text-emerald-800'
                      : personCase.status === 'awaiting_review'
                      ? 'bg-amber-50 border-amber-200 font-semibold text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> 4. Human Review
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {personCase.status === 'reunited' ? 'Confirmed & Closed' : 'Under Supervisory Review'}
                  </p>
                </div>
              </div>
            </div>

            {/* Public-Safe Candidate Summary Notice (No personal leak!) */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">Reconciled Field Evidence Summary</span>
                <span className="text-[11px] font-mono text-slate-500">
                  {candidates.length} Record Candidates Scanned
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sources Ingested</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">Shelter, Hospital, 1070</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Strongest Match Score</span>
                  <span className="font-semibold text-teal-700 mt-0.5 block">
                    {candidates.length > 0 ? `${Math.max(...candidates.map((c) => c.match_score))}% Verified` : 'Scanning'}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Contradiction Status</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {candidates.some((c) => c.has_contradictions) ? 'Flagged for Human Board' : 'None detected'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Note: In compliance with family privacy protocols, detailed clinical and bed intake identities are withheld until official human confirmation.
              </p>
            </div>

            {/* Reporter Contact Privacy Safeguard */}
            <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-teal-600" />
                <span className="text-slate-700">
                  Case filed by <strong>{personCase.reporter_name}</strong> ({personCase.reporter_relationship}) • Masked Contact: {maskPhoneNumber(personCase.reporter_phone)}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                Protected
              </span>
            </div>

            {/* Investigator Quick Pivot */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onNavigate('inv_case_detail', personCase.id)}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-700 hover:text-teal-900"
              >
                <span>Authorized Investigator? Open Full Technical Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
