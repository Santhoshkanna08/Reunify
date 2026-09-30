// REUNIFY Investigator Overview Dashboard
// Real metrics from Supabase / DB. No fake hardcoded counters.

import React, { useState, useEffect } from 'react';
import {
  Users,
  Compass,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Stethoscope,
  PhoneCall,
  Activity,
  ArrowRight,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { db } from '../../lib/supabaseClient';
import { MissingPersonCase, SourceConnection, AgentEvent, Candidate } from '../../types';

interface OverviewDashboardProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [sources, setSources] = useState<SourceConnection[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [allCases, allSources, allEvents, allCands] = await Promise.all([
        db.getCases(),
        db.getSourceConnections(),
        db.getAgentEvents(),
        db.getCandidates(),
      ]);
      setCases(allCases);
      setSources(allSources);
      setEvents(allEvents.slice(0, 8));
      setCandidates(allCands);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('reunify_data_changed', loadData);
    return () => window.removeEventListener('reunify_data_changed', loadData);
  }, []);

  const totalCases = cases.length;
  const underInvestigation = cases.filter((c) => c.status === 'under_investigation').length;
  const awaitingReview = cases.filter((c) => c.status === 'awaiting_review').length;
  const reunited = cases.filter((c) => c.status === 'reunited').length;
  const flaggedContradictions = candidates.filter((c) => c.has_contradictions).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Investigator Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-source evidence reconciliation, contradiction triage & supervisory human review.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('inv_reviews')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Human Review Desk ({awaitingReview})</span>
          </button>

          <button
            onClick={() => onNavigate('report')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition shadow-sm"
          >
            <span>+ New Intake</span>
          </button>
        </div>
      </div>

      {/* Real Statistics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Cases</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">{totalCases}</span>
          <span className="text-[11px] text-teal-700 font-medium block mt-1">
            {cases.filter((c) => c.priority === 'urgent').length} marked urgent priority
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Under Investigation</span>
            <Compass className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-3xl font-extrabold text-teal-700">{underInvestigation}</span>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Autonomous sweeps running
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Review</span>
            <FileCheck2 className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-3xl font-extrabold text-amber-600">{awaitingReview}</span>
          <span className="text-[11px] text-amber-700 font-medium block mt-1">
            {flaggedContradictions} with active contradictions
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reunited / Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-3xl font-extrabold text-emerald-700">{reunited}</span>
          <span className="text-[11px] text-emerald-700 font-medium block mt-1">
            Confirmed by human lead
          </span>
        </div>
      </div>

      {/* Grid: Cases Awaiting Investigation/Review & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-teal-700" />
                <h2 className="text-sm font-bold text-slate-900">Current Missing Person Cases</h2>
              </div>
              <button
                onClick={() => onNavigate('inv_cases')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center"
              >
                <span>View All ({cases.length})</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Case #</th>
                    <th className="py-2.5 px-4">Missing Person</th>
                    <th className="py-2.5 px-4">District</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {cases.slice(0, 5).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.case_number}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{c.full_name}</span>
                        <span className="text-[11px] text-slate-500">
                          {c.age} yrs • {c.gender}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{c.district}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'awaiting_review'
                              ? 'bg-amber-100 text-amber-800'
                              : c.status === 'under_investigation'
                              ? 'bg-teal-100 text-teal-800'
                              : c.status === 'reunited'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigate('inv_case_detail', c.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-teal-800 rounded-lg font-bold text-[11px] transition"
                        >
                          Investigate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>All records marked: <strong>data_origin: synthetic</strong></span>
            <span className="font-mono text-[11px]">PostgreSQL RLS Active</span>
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">Agent & Pipeline Events</h3>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700">
                Live Feed
              </span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs hover:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-slate-900 leading-snug">{evt.headline}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ml-2 ${
                        evt.event_type === 'contradiction_detected'
                          ? 'bg-rose-500'
                          : evt.event_type === 'agent_reflected'
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{evt.description}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('inv_audit')}
            className="mt-4 pt-3 border-t border-slate-100 w-full text-center text-xs font-bold text-teal-700 hover:text-teal-900"
          >
            Open Full Immutable Audit Trail →
          </button>
        </div>
      </div>

      {/* Source Connection Ingestion Health */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Connected Institutional Source Adapters</h3>
          </div>
          <button
            onClick={() => onNavigate('inv_sources')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center"
          >
            <span>Manage Adapters</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sources.map((src) => (
            <div key={src.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 truncate">{src.name.split(' ')[0]}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800">
                  {src.status.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5">
                <div>Type: <strong className="text-slate-700 uppercase font-mono">{src.source_type}</strong></div>
                <div>Records: <strong className="text-slate-700">{src.records_count}</strong></div>
                <div>Adapter: <strong className="text-slate-700 font-mono">{src.adapter_key}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
