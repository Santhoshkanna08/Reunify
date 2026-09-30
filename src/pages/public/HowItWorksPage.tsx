// REUNIFY How It Works Page
// Detailed breakdown of the AI-assisted evidence investigation pipeline

import React from 'react';
import {
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Cpu,
  ArrowDown,
  Building2,
  Stethoscope,
  PhoneCall,
  Users,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Context Ingestion & Case Formulation',
      subtitle: 'The LLM Reasons',
      desc: 'The missing-person report is normalized into key factual tokens (age, last seen coordinates, clothing color, anatomical scars, medical necessities). The AI planner identifies what information is missing and formulates an initial investigative plan.',
      badge: 'Context Ingestion',
      color: 'bg-teal-50 border-teal-200 text-teal-800',
    },
    {
      num: '02',
      title: 'Allowlisted Tool Execution',
      subtitle: 'Strict Safety Bounds',
      desc: 'The agent cannot invent arbitrary queries or browse unvetted systems. It chooses only from allowlisted tools: search_shelter, search_hospital, search_helpline, and search_ngo. Calls are dispatched to institutional adapters.',
      badge: 'Tool Dispatch',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    {
      num: '03',
      title: 'Deterministic Verification & Scoring',
      subtitle: 'The System Verifies',
      desc: 'Candidate scores are NEVER assigned by the LLM. Instead, a strict mathematical verification engine evaluates exact factors: ID/Wristband match (+30), Age compatibility within ±2 yrs (+15), District match (+15), Time compatibility (+10), Clothing overlap (+10), Marks (+15), and Name similarity (+20). Missing fields are never penalized.',
      badge: 'Deterministic Math',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    },
    {
      num: '04',
      title: 'Spatiotemporal Contradiction Guard',
      subtitle: 'Physics Over Hallucination',
      desc: 'When records conflict — such as a wristband recorded in Madurai and Theni within 25 minutes (requiring 180 km/h transit) — the contradiction engine flags the anomaly, applies a -25 point penalty, and routes the issue for supervisory review.',
      badge: 'Contradiction Guard',
      color: 'bg-amber-50 border-amber-200 text-amber-800',
    },
    {
      num: '05',
      title: 'Reflection & Autonomous Re-planning',
      subtitle: 'Agent Reflection State',
      desc: 'Upon encountering a contradiction, the investigation enters the "needs_reassessment" state. The LLM reflects on possible causes (e.g. data entry delay vs duplicate barcode issuance) and dispatches a secondary query to corroborating sources.',
      badge: 'Reflection Cycle',
      color: 'bg-purple-50 border-purple-200 text-purple-800',
    },
    {
      num: '06',
      title: 'Supervisory Human Review & Decision',
      subtitle: 'The Human Decides',
      desc: 'Before any family is notified or record closed, a certified human reviewer examines the complete evidence dossier, weighs the contradiction explanations, and executes the final approval or request for field verification.',
      badge: 'Human Confirmation',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          <span>System Architecture & Verification Principles</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How REUNIFY Works
        </h1>
        <p className="mt-3 text-base text-slate-600">
          A transparent, evidence-first platform built on the steadfast conviction that artificial intelligence
          should assist evidence gathering, but human experts must retain final authority.
        </p>
      </div>

      {/* Slogan Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 text-center shadow-xl">
        <span className="text-xs uppercase font-bold tracking-widest text-teal-400 block mb-1">
          Our Guiding Philosophy
        </span>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 flex flex-wrap items-center justify-center gap-3">
          <span className="text-teal-300">The LLM reasons.</span>
          <span className="text-slate-500">→</span>
          <span className="text-amber-300">The system verifies.</span>
          <span className="text-slate-500">→</span>
          <span className="text-emerald-300">The human decides.</span>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm mt-3 max-w-2xl mx-auto">
          No automated model is ever permitted to pronounce an identity confirmed without forensic human review.
        </p>
      </div>

      {/* Pipeline Steps */}
      <div className="space-y-4">
        {steps.map((s, idx) => (
          <div
            key={s.num}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-teal-300 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start space-x-4">
                <span className="text-2xl font-black text-slate-300 font-mono">{s.num}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>
                      {s.badge}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-teal-700 block mt-0.5">{s.subtitle}</span>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-3xl">{s.desc}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scoring Matrix Breakdown Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Deterministic Scoring Matrix (Max 100 Pts)</h2>
        <p className="text-xs text-slate-500 mb-4">
          All calculations are implemented purely in TypeScript/PostgreSQL without AI hallucination.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3">Criteria</th>
                <th className="py-2.5 px-3">Weight</th>
                <th className="py-2.5 px-3">Evaluation Rule</th>
                <th className="py-2.5 px-3">Handling of Missing Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 px-3 font-semibold">Known ID / Wristband Match</td>
                <td className="py-2.5 px-3 text-teal-700 font-bold">+30 pts</td>
                <td className="py-2.5 px-3">Direct identifier or wristband barcode match</td>
                <td className="py-2.5 px-3 text-slate-400">0 pts (Not penalized)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Age Compatibility</td>
                <td className="py-2.5 px-3 text-teal-700 font-bold">+15 pts</td>
                <td className="py-2.5 px-3">Reported age falls within ±2 years of source intake</td>
                <td className="py-2.5 px-3 text-slate-400">0 pts</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">District & Location</td>
                <td className="py-2.5 px-3 text-teal-700 font-bold">+15 pts</td>
                <td className="py-2.5 px-3">Same administrative district or direct landmark proximity</td>
                <td className="py-2.5 px-3 text-slate-400">0 pts</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Chronological Feasibility</td>
                <td className="py-2.5 px-3 text-teal-700 font-bold">+10 pts</td>
                <td className="py-2.5 px-3">Source record logged at or after last seen date/time</td>
                <td className="py-2.5 px-3 text-slate-400">0 pts</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Clothing Overlap</td>
                <td className="py-2.5 px-3 text-teal-700 font-bold">+10 pts</td>
                <td className="py-2.5 px-3">Garment color, type, or footwear token intersection</td>
                <td className="py-2.5 px-3 text-slate-400">0 pts</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Distinguishing Marks / Scars</td>
                <td className="py-2.5 px-3 text-teal-700 font-bold">+15 pts</td>
                <td className="py-2.5 px-3">Anatomical scars, tattoos, or surgical marks match</td>
                <td className="py-2.5 px-3 text-slate-400">0 pts</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Name & Alias Similarity</td>
                <td className="py-2.5 px-3 text-teal-700 font-bold">Up to +20 pts</td>
                <td className="py-2.5 px-3">Levenshtein similarity &gt; 75% or matching alias token</td>
                <td className="py-2.5 px-3 text-slate-400">0 pts</td>
              </tr>
              <tr className="bg-rose-50/50">
                <td className="py-2.5 px-3 font-semibold text-rose-800">Spatiotemporal Contradiction</td>
                <td className="py-2.5 px-3 text-rose-700 font-bold">-25 pts</td>
                <td className="py-2.5 px-3 text-rose-800">
                  Required transit velocity exceeds 90 km/h or impossible simultaneous presence
                </td>
                <td className="py-2.5 px-3 text-rose-600 font-medium">Flags Human Review</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
