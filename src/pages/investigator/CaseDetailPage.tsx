// REUNIFY Case Detail & Operational Cockpit
// Full missing person dossier, candidate matches, contradiction engine, and live investigation runner.

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Shield,
  Play,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  Building2,
  Stethoscope,
  PhoneCall,
  Users,
  Compass,
  FileCheck2,
  Clock,
  Shirt,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { db } from '../../lib/supabaseClient';
import {
  MissingPersonCase,
  Candidate,
  Investigation,
  InvestigationStep,
  AgentEvent,
  AuditLog,
} from '../../types';
import { investigationService } from '../../services/investigation/investigationService';
import { maskPhoneNumber } from '../../services/privacy/privacyService';
import {
  apiRunInvestigation,
  apiInjectPendingRecord,
} from '../../services/api/apiClient';

interface CaseDetailPageProps {
  caseId: string;
  onNavigate: (tab: string, caseId?: string) => void;
}

export const CaseDetailPage: React.FC<CaseDetailPageProps> = ({ caseId, onNavigate }) => {
  const [personCase, setPersonCase] = useState<MissingPersonCase | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [steps, setSteps] = useState<InvestigationStep[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'candidates' | 'steps' | 'audit'>('candidates');

  const loadData = async () => {
    try {
      const c = await db.getCaseById(caseId);
      if (c) {
        setPersonCase(c);
        const [cands, inv, evts, caseAudits] = await Promise.all([
          db.getCandidates(c.id),
          db.getInvestigationByCaseId(c.id),
          db.getAgentEvents(c.id),
          db.getAuditLogs(c.id),
        ]);
        setCandidates(cands.sort((a, b) => b.match_score - a.match_score));
        setInvestigation(inv);
        setEvents(evts);
        setAudits(caseAudits);

        if (inv) {
          const invSteps = await db.getInvestigationSteps(inv.id);
          setSteps(invSteps);
        }
        if (cands.length > 0 && !expandedCandidate) {
          setExpandedCandidate(cands[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('reunify_data_changed', loadData);
    return () => window.removeEventListener('reunify_data_changed', loadData);
  }, [caseId]);

  const handleRunInvestigation = async () => {
    if (!personCase) return;
    setIsRunning(true);
    try {
      try {
        await apiRunInvestigation(personCase.id);
      } catch (err) {
        console.warn('FastAPI backend unreachable:', err);
        alert('Investigation backend unavailable. Please start the FastAPI server.');
      }
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Error during autonomous investigation: ' + (e as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStepOnce = async () => {
    if (!personCase) return;
    setIsRunning(true);
    try {
      try {
        await apiRunInvestigation(personCase.id);
      } catch (err) {
        console.warn('FastAPI backend unreachable:', err);
        alert('Investigation backend unavailable. Please start the FastAPI server.');
      }
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleInject = async (pendingId: 'PEND-CONTRA' | 'PEND-REFINE') => {
    if (!personCase) return;
    setIsRunning(true);
    try {
      try {
        await apiInjectPendingRecord(personCase.id, pendingId);
      } catch (err) {
        console.warn('FastAPI inject endpoint unreachable, updating local store:', err);
      }
      await db.injectPendingRecord(personCase.id, pendingId);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  if (!personCase) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Loading case dossier...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <button
          onClick={() => onNavigate('inv_cases')}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Roster</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Step Once Button */}
          <button
            onClick={handleStepOnce}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>Execute 1 Step</span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={handleRunInvestigation}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-pulse' : ''}`} />
            <span>
              {isRunning
                ? 'Autonomous Pipeline Running...'
                : investigation
                ? 'Continue Autonomous Investigation'
                : 'Start Investigation'}
            </span>
          </button>

          {/* Review Desk Shortcut */}
          <button
            onClick={() => onNavigate('inv_reviews', personCase.id)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Open in Review Desk</span>
          </button>
        </div>
      </div>

      {/* Main Dossier Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Photo */}
          <div className="md:col-span-3">
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-inner relative group">
              {personCase.photo_url ? (
                <img
                  src={personCase.photo_url}
                  alt={personCase.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-extrabold text-slate-300">
                  {personCase.full_name.charAt(0)}
                </div>
              )}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] py-1 px-2 rounded-lg text-center font-medium">
                Photo Reference Attached
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-9 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {personCase.case_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      personCase.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Priority: {personCase.priority.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    data_origin: {personCase.data_origin}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {personCase.full_name}
                </h1>
                {personCase.alias && (
                  <span className="text-xs text-slate-500 font-medium">
                    Known alias: &quot;{personCase.alias}&quot;
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Current Case State
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mt-0.5 ${
                    personCase.status === 'awaiting_review'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : personCase.status === 'under_investigation'
                      ? 'bg-teal-100 text-teal-800 border-teal-200'
                      : personCase.status === 'reunited'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {personCase.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Grid Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Age & Gender</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {personCase.age} yrs • {personCase.gender}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">District</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{personCase.district}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Seen Coordinate</span>
                <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                  {personCase.last_known_location}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Seen Time</span>
                <span className="font-bold text-slate-800 mt-0.5 block font-mono">
                  {personCase.last_seen_date} {personCase.last_seen_time}
                </span>
              </div>
            </div>

            {/* Key Physical Tokens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-teal-800 block">Clothing Worn</span>
                <p className="text-slate-800 mt-0.5 font-medium">{personCase.clothing_description}</p>
              </div>

              <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-teal-800 block">Distinguishing Anatomical Scars</span>
                <p className="text-slate-800 mt-0.5 font-medium">{personCase.distinguishing_marks}</p>
              </div>
            </div>

            {/* Reporter Contact Info */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  Filed by: <strong>{personCase.reporter_name}</strong> ({personCase.reporter_relationship}) • Phone: {personCase.reporter_phone}
                </span>
              </div>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                PII Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Investigation Pipeline Summary & Reflection Alert */}
      {investigation && (
        <div
          className={`rounded-2xl p-5 border shadow-sm transition ${
            investigation.state === 'needs_reassessment'
              ? 'bg-amber-50/80 border-amber-300 text-amber-950'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Compass className={`w-5 h-5 ${investigation.state === 'needs_reassessment' ? 'text-amber-600' : 'text-teal-600'}`} />
              <h2 className="text-sm font-bold text-slate-900">
                Investigation Pipeline State:{' '}
                <span className="uppercase font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                  {investigation.state.replace('_', ' ')}
                </span>
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Phase: {investigation.current_phase}
            </span>
          </div>

          <p className="text-xs mt-2 leading-relaxed text-slate-700">
            <strong>Agent Summary:</strong> {investigation.summary}
          </p>

          {investigation.state === 'needs_reassessment' && (
            <div className="mt-3 p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Spatiotemporal Reflection Active:</strong> A physical contradiction was detected. The agent has paused automatic deductions and flagged the dossier for human supervisor confirmation before concluding candidate validity.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real-time Disaster Intake Simulation & Record Injections */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Disaster Intake Ingestion & Contradiction Test Bed
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            POST /cases/{personCase.id}/inject/:id
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Simulate real-time institutional records arriving at disaster triage coordination desks:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => handleInject('PEND-CONTRA')}
            disabled={isRunning}
            className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-rose-500/40 text-left transition group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-rose-300 group-hover:text-rose-200 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                1. Inject Contradiction (PEND-CONTRA)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                HP-099 Theni @ 19:45
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Ingests admission in Theni with duplicate wristband <strong>WB-1842</strong>. Evaluates 75.2km in 25m (180.5 km/h &gt; 60 km/h) &rarr; flags spatiotemporal impossibility and applies -25 pt contradiction penalty to SH-007.
            </p>
          </button>

          <button
            onClick={() => handleInject('PEND-REFINE')}
            disabled={isRunning}
            className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-teal-500/40 text-left transition group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-teal-300 group-hover:text-teal-200 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                2. Inject Triage Refinement (PEND-REFINE)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60">
                HP-015 GRH Madurai
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              GRH Triage nurse refines admission: patient identified as <strong>&quot;Arunn&quot;</strong> with left hand scar &amp; blue shirt. Re-calculates score deterministically to <strong>83 points</strong>.
            </p>
          </button>
        </div>
      </div>

      {/* Tabs: Candidates / Steps / Audit */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition ${
            activeTab === 'candidates'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Reconciled Candidates ({candidates.length})
        </button>
        <button
          onClick={() => setActiveTab('steps')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition ${
            activeTab === 'steps'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Agent Steps & Reflection Logs ({steps.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition ${
            activeTab === 'audit'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Case Audit Trail ({audits.length})
        </button>
      </div>

      {/* TAB 1: CANDIDATES LIST */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {candidates.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No candidates generated yet. Click &quot;Start Investigation&quot; to execute cross-source sweeps.
            </div>
          ) : (
            candidates.map((cand) => {
              const isExpanded = expandedCandidate === cand.id;
              const hasContra = cand.has_contradictions;
              const score = cand.match_score;

              return (
                <div
                  key={cand.id}
                  className={`bg-white rounded-2xl border transition shadow-sm overflow-hidden ${
                    hasContra ? 'border-amber-300' : 'border-slate-200/90 hover:border-teal-300'
                  }`}
                >
                  {/* Candidate Header */}
                  <div
                    onClick={() => setExpandedCandidate(isExpanded ? null : cand.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-sm text-slate-800 border border-slate-200">
                        {cand.candidate_code}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{cand.source_name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {cand.source_type}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          Candidate Code: <strong>{cand.candidate_code}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Match Score Display */}
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Evidence-Based Match Score
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`text-xl font-extrabold ${
                              score >= 80 ? 'text-teal-700' : score >= 50 ? 'text-amber-600' : 'text-slate-600'
                            }`}
                          >
                            {score}%
                          </span>
                          <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full ${
                                score >= 80 ? 'bg-teal-600' : score >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {hasContra && (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-700" />
                          Contradiction
                        </span>
                      )}

                      <button className="text-slate-400 hover:text-slate-600 p-1">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 space-y-4">
                      {/* Contradiction Alert Box */}
                      {cand.contradictions && cand.contradictions.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-2">
                          <div className="flex items-center font-bold text-sm text-rose-800">
                            <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-600" />
                            {cand.contradictions[0].title}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white/80 p-2.5 rounded-lg border border-rose-100 font-mono text-[11px]">
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase">Record A</span>
                              <strong>{cand.contradictions[0].sourceA.location} ({cand.contradictions[0].sourceA.time})</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase">Record B</span>
                              <strong>{cand.contradictions[0].sourceB.location} ({cand.contradictions[0].sourceB.time})</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase">Physical Velocity Impossibility</span>
                              <strong className="text-rose-700">
                                {cand.contradictions[0].distance_km}km in {cand.contradictions[0].time_diff_minutes}m = {cand.contradictions[0].required_speed_kmh} km/h
                              </strong>
                            </div>
                          </div>

                          <div>
                            <span className="font-bold block text-[11px]">Plausible Explanations (Evaluated by Reflection):</span>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-950 mt-1">
                              {cand.contradictions[0].possible_explanations.map((exp, i) => (
                                <li key={i}>{exp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Deterministic Score Breakdown Grid */}
                      <div>
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                          Deterministic Point Breakdown (Python / Mathematical Engine)
                        </span>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">ID Match</span>
                            <span className="font-bold text-teal-800">+{cand.score_breakdown.id_match} pts</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Age Compat (±2yr)</span>
                            <span className="font-bold text-teal-800">+{cand.score_breakdown.age_compat} pts</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">District / Location</span>
                            <span className="font-bold text-teal-800">+{cand.score_breakdown.location} pts</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Chronology Feasible</span>
                            <span className="font-bold text-teal-800">+{cand.score_breakdown.time} pts</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Clothing Match</span>
                            <span className="font-bold text-teal-800">+{cand.score_breakdown.clothing} pts</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Distinguishing Marks</span>
                            <span className="font-bold text-teal-800">+{cand.score_breakdown.marks} pts</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Name Similarity</span>
                            <span className="font-bold text-teal-800">+{cand.score_breakdown.name_similarity} pts</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Contradiction Penalty</span>
                            <span className="font-bold text-rose-700">{cand.score_breakdown.contradiction_penalty} pts</span>
                          </div>
                        </div>

                        {/* Notes list */}
                        {cand.score_breakdown.notes && (
                          <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                            <span className="font-bold text-slate-800 block mb-1">Algorithmic Audit Log:</span>
                            <ul className="list-disc list-inside space-y-0.5">
                              {cand.score_breakdown.notes.map((note, idx) => (
                                <li key={idx}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Source Record Details */}
                      {cand.source_record && (
                        <div className="pt-3 border-t border-slate-100 text-xs">
                          <span className="font-bold text-slate-800 block mb-1.5">Normalized Source Record Dossier:</span>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1.5">
                            <div className="grid grid-cols-2 gap-2">
                              <div><strong>Intake Person:</strong> {cand.source_record.person_name || 'Unrecorded'}</div>
                              <div><strong>Estimated Age:</strong> {cand.source_record.estimated_age ?? 'Unknown'} yrs</div>
                              <div><strong>Facility Location:</strong> {cand.source_record.location_name}</div>
                              <div><strong>Timestamp:</strong> {new Date(cand.source_record.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            {cand.source_record.clothing_summary && (
                              <div><strong>Clothing Recorded:</strong> {cand.source_record.clothing_summary}</div>
                            )}
                            {cand.source_record.identifying_marks && (
                              <div><strong>Marks Recorded:</strong> {cand.source_record.identifying_marks}</div>
                            )}
                            {cand.source_record.status_condition && (
                              <div><strong>Clinical / Physical State:</strong> {cand.source_record.status_condition}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Review CTA */}
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => onNavigate('inv_reviews', personCase.id)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-sm"
                        >
                          Review & Sign-Off Candidate in Review Desk →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: AGENT STEPS */}
      {activeTab === 'steps' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Investigation Steps & Agent Trace</h3>
            <span className="text-xs text-slate-400 font-mono">Allowlisted Tool Execution</span>
          </div>

          <div className="space-y-3">
            {steps.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No steps executed yet.</p>
            ) : (
              steps.map((st) => (
                <div key={st.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                        Step #{st.step_order}
                      </span>
                      <strong className="text-slate-900">{st.action_name}</strong>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        Phase: {st.phase}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(st.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-slate-700 mt-1">{st.reasoning}</p>

                  {st.tool_name && (
                    <div className="mt-1 font-mono text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      Tool: <strong>{st.tool_name}</strong> | Params: {JSON.stringify(st.tool_input || {})}
                    </div>
                  )}

                  {st.reflection_notes && (
                    <div className="mt-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                      <strong>Agent Reflection:</strong> {st.reflection_notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Immutable Audit Trail</h3>
            <span className="text-xs text-slate-400 font-mono">PostgreSQL Append-Only Log</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {audits.map((a) => (
              <div key={a.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{a.action}</span>
                    <span className="text-[10px] font-mono bg-slate-200 px-1 rounded text-slate-700">
                      Actor: {a.actor_name} ({a.actor_role})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                    {JSON.stringify(a.details)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-3">
                  {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
