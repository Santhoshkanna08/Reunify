// REUNIFY Candidate Evidence Reconciliation Comparison Page
import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { db } from '../../lib/supabaseClient';
import { Candidate, MissingPersonCase } from '../../types';

interface CandidatesPageProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const CandidatesPage: React.FC<CandidatesPageProps> = ({ onNavigate }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    const [allCands, allCases] = await Promise.all([db.getCandidates(), db.getCases()]);
    setCandidates(allCands.sort((a, b) => b.match_score - a.match_score));
    setCases(allCases);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('reunify_data_changed', loadData);
    return () => window.removeEventListener('reunify_data_changed', loadData);
  }, []);

  const filtered = candidates.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && c.source_type !== sourceFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const codeMatch = c.candidate_code.toLowerCase().includes(q);
      const nameMatch = c.source_name.toLowerCase().includes(q);
      return codeMatch || nameMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Candidate Evidence Reconciliation Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-facility candidate records scored against reported missing person tokens.
          </p>
        </div>

        <button
          onClick={() => onNavigate('inv_reviews')}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm"
        >
          <span>Open Human Review Desk</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate code, camp or facility..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Candidate Statuses</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Sources</option>
            <option value="shelter">Shelters</option>
            <option value="hospital">Hospitals</option>
            <option value="helpline">Helplines</option>
            <option value="ngo">NGOs</option>
          </select>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cand) => {
          const associatedCase = cases.find((c) => c.id === cand.case_id);
          const score = cand.match_score;
          const hasContra = cand.has_contradictions;

          return (
            <div
              key={cand.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 transition ${
                hasContra ? 'border-amber-300' : 'border-slate-200/90 hover:border-teal-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {cand.candidate_code}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {cand.source_type}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cand.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cand.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {cand.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{cand.source_name}</h3>
                  <span className="text-xs text-slate-500">
                    Linked to case: <strong>{associatedCase?.full_name || cand.case_id}</strong> (
                    {associatedCase?.case_number})
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Match Score</span>
                  <span
                    className={`text-2xl font-extrabold ${
                      score >= 80 ? 'text-teal-700' : score >= 50 ? 'text-amber-600' : 'text-slate-600'
                    }`}
                  >
                    {score}%
                  </span>
                </div>
              </div>

              {/* Point Breakdown Bars */}
              <div className="grid grid-cols-4 gap-1.5 text-[11px] pt-2 border-t border-slate-100">
                <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 block uppercase">Age</span>
                  <strong>+{cand.score_breakdown.age_compat}</strong>
                </div>
                <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 block uppercase">District</span>
                  <strong>+{cand.score_breakdown.location}</strong>
                </div>
                <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 block uppercase">Clothing</span>
                  <strong>+{cand.score_breakdown.clothing}</strong>
                </div>
                <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 block uppercase">Marks</span>
                  <strong>+{cand.score_breakdown.marks}</strong>
                </div>
              </div>

              {hasContra && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Contradiction Warning (-25 pts applied):</strong>
                    <p className="text-[11px] mt-0.5">
                      Spatiotemporal conflict detected. Flagged for supervisory resolution.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Recorded: {new Date(cand.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onNavigate('inv_case_detail', cand.case_id)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center"
                >
                  <span>Open in Case Cockpit</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
