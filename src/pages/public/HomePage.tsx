// REUNIFY Public Home Page
// Theme: Light, pleasant, trustworthy, human, modern, calm
// Motif: Evidence Connection

import React, { useState, useEffect } from 'react';
import {
  Shield,
  FilePlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  HeartHandshake,
  Activity,
  FileText,
  Compass,
} from 'lucide-react';
import { EvidenceConstellation } from '../../components/EvidenceConstellation';
import { db } from '../../lib/supabaseClient';
import { MissingPersonCase } from '../../types';

interface HomePageProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    investigating: 0,
    awaitingReview: 0,
    reunited: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      const allCases = await db.getCases();
      setCases(allCases);
      setStats({
        total: allCases.length,
        investigating: allCases.filter((c) => c.status === 'under_investigation').length,
        awaitingReview: allCases.filter((c) => c.status === 'awaiting_review').length,
        reunited: allCases.filter((c) => c.status === 'reunited').length,
      });
    };
    loadData();
    window.addEventListener('reunify_data_changed', loadData);
    return () => window.removeEventListener('reunify_data_changed', loadData);
  }, []);

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-4">
        {/* Hackathon problem badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span>HACKSPRINT &apos;26 • DM-05: Missing Persons & Family Reunification</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Finding the connection <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-[#0F2942] to-teal-800">
            between the records.
          </span>
        </h1>

        <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
          Reunify helps investigators reconcile fragmented missing-person records across shelters,
          hospitals, helplines, and NGOs, verify evidence deterministically, and detect contradictions —
          without replacing human judgment.
        </p>

        {/* Primary Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          <button
            onClick={() => onNavigate('report')}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-teal-700 text-white font-bold text-sm hover:bg-teal-800 transition shadow-lg shadow-teal-700/20"
          >
            <FilePlus className="w-4 h-4" />
            <span>Report a Missing Person</span>
          </button>

          <button
            onClick={() => onNavigate('track')}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-white text-slate-800 border border-slate-300 font-bold text-sm hover:bg-slate-50 transition shadow-sm"
          >
            <Search className="w-4 h-4 text-slate-500" />
            <span>Search Case Status</span>
          </button>
        </div>

        {/* Product Principle Slogan Pill */}
        <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-2 px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold tracking-wider shadow-md">
          <span className="text-teal-300">THE LLM REASONS.</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-300">THE SYSTEM VERIFIES.</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-300">THE HUMAN DECIDES.</span>
        </div>
      </section>

      {/* Interactive Constellation Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EvidenceConstellation />
      </section>

      {/* Real Real-Time Database Metrics Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Live Disaster Ingestion Metrics
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">Database Synchronized</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">Total Active Cases</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
                {stats.total}
              </span>
              <span className="text-[11px] text-teal-700 font-medium">Recorded in Supabase</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">Under Investigation</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-teal-700 mt-1 block">
                {stats.investigating}
              </span>
              <span className="text-[11px] text-slate-500">Autonomous sweeps active</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">Awaiting Human Review</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 block">
                {stats.awaitingReview}
              </span>
              <span className="text-[11px] text-amber-700 font-medium">Contradictions reconciled</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">Reunited / Confirmed</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1 block">
                {stats.reunited}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Human sign-off executed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Scenario Showcase: Arun Madurai Case */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#0F2942] to-slate-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden relative">
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Flagship Scenario: Reconciling Evidence Under Discrepancy</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Case Study: The Arun Kumar Investigation
            </h2>

            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              Arun (22, Madurai) went missing during Vaigai river flooding. Candidate <strong>SH-007</strong> at Sellur
              Relief Camp matched his surgical hand scar and blue shirt (85% match). Simultaneously, a hospital record in Theni
              claimed the same wristband tag <strong>WB-1842</strong> just 25 minutes earlier — implying an impossible 180 km/h travel speed.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                <span className="text-[10px] text-teal-300 uppercase font-bold block">Physical Match</span>
                <span className="text-xs font-semibold text-white mt-0.5 block">Scar on left hand + Blue shirt</span>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                <span className="text-[10px] text-amber-300 uppercase font-bold block">Contradiction Guard</span>
                <span className="text-xs font-semibold text-white mt-0.5 block">Madurai ↔ Theni 75km in 25min (Flagged)</span>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                <span className="text-[10px] text-emerald-300 uppercase font-bold block">Supervisor Review</span>
                <span className="text-xs font-semibold text-white mt-0.5 block">Human decides without AI override</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('inv_case_detail', 'case-arun-001')}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
              >
                <span>Open Arun Case in Investigator Desk</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('track')}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition border border-white/20"
              >
                <span>Track As Family Reporter</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars of Responsible Reunification */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Architected for Critical Human Needs
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Missing persons work cannot tolerate black-box guesswork. Every decision must be traceable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-teal-300 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Source Reconciliation</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Normalizes unstructured records across municipal shelters, hospital triage bays, 1070 helpline logs, and NGO field posts.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-teal-300 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Deterministic Scoring</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Match scores are calculated by explicit mathematical algorithms — never hallucinated by an LLM. Missing information is never counted as mismatch.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-teal-300 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Contradiction Guard</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Detects spatiotemporal impossibilities such as duplicate wristbands or superhuman travel speeds. Automatically prompts agent reflection.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-teal-300 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 mb-4">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Human Supervisory Desk</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              No candidate is ever automatically pronounced a match. Authorized human reviewers evaluate evidence dossiers and execute final sign-offs.
            </p>
          </div>
        </div>
      </section>

      {/* Emergency Resources Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Are you in an immediate life-safety crisis?</h3>
            <p className="text-xs text-slate-600 mt-1">
              Contact official state disaster control rooms directly for water rescues, boat evacuations, or urgent ambulance dispatches.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => onNavigate('resources')}
              className="px-4 py-2 bg-white text-slate-800 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition shadow-sm"
            >
              View All Emergency Helplines
            </button>
            <button
              onClick={() => onNavigate('report')}
              className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 transition shadow-sm"
            >
              File Missing Report Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
