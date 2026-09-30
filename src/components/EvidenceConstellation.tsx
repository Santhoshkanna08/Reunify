// REUNIFY Interactive Evidence Constellation
// Conceptual motif: "Finding the connection between the records"
// Visually represents the central missing person case connected to
// Shelters, Hospitals, Helplines, and NGOs with interactive discovery.

import React, { useState } from 'react';
import { Shield, Building2, Stethoscope, PhoneCall, Users, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { SourceType } from '../types';

interface NodeData {
  id: SourceType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeColor: string;
  recordsCount: string;
  lastSync: string;
  activeEvidence: string;
  contradictionAlert?: string;
  x: number; // percentage in SVG viewport
  y: number;
}

const NODES: NodeData[] = [
  {
    id: 'shelter',
    title: 'Shelter Network',
    subtitle: 'SDMA Relief Camps',
    icon: Building2,
    color: 'stroke-teal-500 fill-teal-50 text-teal-600',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    recordsCount: '1,420 Active Intakes',
    lastSync: '4 mins ago',
    activeEvidence: 'Candidate SH-007 matched scar & blue shirt at Sellur Camp',
    x: 20,
    y: 28,
  },
  {
    id: 'hospital',
    title: 'Hospital Emergency',
    subtitle: 'HIMS Trauma Bays',
    icon: Stethoscope,
    color: 'stroke-rose-500 fill-rose-50 text-rose-600',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    recordsCount: '875 Triage Records',
    lastSync: '2 mins ago',
    activeEvidence: 'Patient HP-099 logged in Theni with wristband WB-1842',
    contradictionAlert: 'Spatiotemporal conflict: 180 km/h transit required between Madurai & Theni',
    x: 80,
    y: 28,
  },
  {
    id: 'helpline',
    title: 'Distress Helpline',
    subtitle: 'State 1070 / 1077 Desk',
    icon: PhoneCall,
    color: 'stroke-amber-500 fill-amber-50 text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    recordsCount: '2,150 Sighting Calls',
    lastSync: '8 mins ago',
    activeEvidence: 'Call #304: Civilian sighting of Arun walking towards Sellur School',
    x: 20,
    y: 72,
  },
  {
    id: 'ngo',
    title: 'NGO Field Teams',
    subtitle: 'Red Cross & Volunteers',
    icon: Users,
    color: 'stroke-indigo-500 fill-indigo-50 text-indigo-600',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    recordsCount: '640 Field Entries',
    lastSync: '15 mins ago',
    activeEvidence: 'Volunteer log: Aid kit distribution & cell link assistance',
    x: 80,
    y: 72,
  },
];

export const EvidenceConstellation: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NodeData>(NODES[0]);
  const [activeHover, setActiveHover] = useState<string | null>(null);

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-3xl bg-gradient-to-b from-white/90 via-slate-50/80 to-white/90 p-6 md:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Interactive Evidence Constellation
          </span>
        </div>
        <span className="text-xs font-medium text-slate-400">Click any source node to inspect</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Constellation Canvas SVG */}
        <div className="lg:col-span-7 relative h-[360px] md:h-[400px] w-full flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Ambient Background Grid Pattern */}
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0D9488" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#0F2942" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0D9488" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="alertGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EA580C" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Connecting lines from Center (50, 50) to each source node */}
            {NODES.map((node) => {
              const isSelected = selectedNode.id === node.id;
              const hasAlert = !!node.contradictionAlert;
              return (
                <g key={`line-${node.id}`}>
                  <line
                    x1="50"
                    y1="50"
                    x2={node.x}
                    y2={node.y}
                    stroke={hasAlert ? 'url(#alertGrad)' : isSelected ? '#0D9488' : '#CBD5E1'}
                    strokeWidth={isSelected ? '0.8' : '0.4'}
                    strokeDasharray={isSelected ? '2,1' : 'none'}
                    className={isSelected ? 'transition-all duration-300' : ''}
                  />
                  {/* Subtle animated pulse particle along connection line */}
                  <circle r="0.8" fill={hasAlert ? '#EA580C' : '#0D9488'}>
                    <animate
                      attributeName="cx"
                      values={`50;${node.x};50`}
                      dur={hasAlert ? '2.5s' : '4s'}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values={`50;${node.y};50`}
                      dur={hasAlert ? '2.5s' : '4s'}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}

            {/* Orbit verification ring around center */}
            <circle
              cx="50"
              cy="50"
              r="18"
              fill="none"
              stroke="#0D9488"
              strokeWidth="0.3"
              strokeDasharray="1,2"
              opacity="0.4"
            />
          </svg>

          {/* Center Hub: The Missing Person Case */}
          <div
            className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0F2942] text-white shadow-xl shadow-[#0F2942]/20 border-2 border-teal-400/40 w-32 h-32 text-center"
          >
            <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center mb-1 text-teal-300">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white tracking-wide leading-tight">
              Missing Person
            </span>
            <span className="text-[10px] text-teal-200/80 font-mono mt-0.5">CASE-2026-0842</span>
            <span className="text-[9px] bg-teal-500/30 text-teal-200 px-1.5 py-0.5 rounded-full mt-1">
              Active Focus
            </span>
          </div>

          {/* Interactive Source Nodes */}
          {NODES.map((node) => {
            const isSelected = selectedNode.id === node.id;
            const Icon = node.icon;
            const hasAlert = !!node.contradictionAlert;

            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                onMouseEnter={() => setActiveHover(node.id)}
                onMouseLeave={() => setActiveHover(null)}
                style={{
                  position: 'absolute',
                  top: `${node.y}%`,
                  left: `${node.x}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`group z-30 flex flex-col items-center text-center focus:outline-none transition-all duration-300 ${
                  isSelected ? 'scale-110' : 'hover:scale-105'
                }`}
              >
                <div
                  className={`w-13 h-13 rounded-2xl p-3 flex items-center justify-center transition-all duration-300 shadow-md ${
                    isSelected
                      ? 'bg-white ring-4 ring-teal-500/30 border-2 border-teal-600 shadow-teal-500/20'
                      : 'bg-white/95 border border-slate-200 hover:border-teal-400'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${hasAlert ? 'text-rose-600' : 'text-slate-700'}`} />
                </div>
                <div className="mt-1.5 flex flex-col items-center">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-800 bg-white/80 border border-slate-200/60'
                    }`}
                  >
                    {node.title}
                  </span>
                  {hasAlert && (
                    <span className="mt-0.5 inline-flex items-center text-[9px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.2 rounded-full">
                      <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Contradiction
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Node Detail Inspector Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <selectedNode.icon className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-none">{selectedNode.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedNode.subtitle}</p>
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${selectedNode.badgeColor}`}>
                Connected
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Records</span>
                  <span className="font-semibold text-slate-800">{selectedNode.recordsCount}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Synced</span>
                  <span className="font-semibold text-slate-800">{selectedNode.lastSync}</span>
                </div>
              </div>

              <div className="bg-teal-50/70 border border-teal-100 p-3 rounded-xl">
                <div className="flex items-center text-xs font-semibold text-teal-900 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                  Reconciled Evidence Item
                </div>
                <p className="text-xs text-teal-950/80 leading-relaxed">
                  {selectedNode.activeEvidence}
                </p>
              </div>

              {selectedNode.contradictionAlert && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
                  <div className="flex items-center text-xs font-semibold text-rose-900 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                    Spatiotemporal Contradiction Guard
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed font-mono">
                    {selectedNode.contradictionAlert}
                  </p>
                  <p className="text-[11px] text-rose-600 mt-1.5 italic">
                    Flagged for Human Reviewer decision before confirmation.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Reconciled via SourceAdapter</span>
            <span className="inline-flex items-center font-semibold text-teal-700">
              Verified Pipeline <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
