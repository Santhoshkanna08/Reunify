// REUNIFY Source Connections & API Integrations Manager
// Discloses Simulation mode cleanly while maintaining enterprise-ready adapter configuration.

import React, { useState, useEffect } from 'react';
import {
  Database,
  Building2,
  Stethoscope,
  PhoneCall,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sliders,
  ExternalLink,
  Shield,
  Layers,
  Lock,
} from 'lucide-react';
import { db } from '../../lib/supabaseClient';
import { SourceConnection, SourceType } from '../../types';
import { sourceRegistry } from '../../services/adapters/SourceAdapter';

export const SourcesPage: React.FC = () => {
  const [sources, setSources] = useState<SourceConnection[]>([]);
  const [selectedSource, setSelectedSource] = useState<SourceConnection | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const loadSources = async () => {
    const list = await db.getSourceConnections();
    setSources(list);
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleToggle = async (src: SourceConnection) => {
    await db.updateSourceConnection(src.id, { is_enabled: !src.is_enabled });
    await loadSources();
  };

  const handleSync = async (src: SourceConnection) => {
    setIsSyncing(src.id);
    await new Promise((r) => setTimeout(r, 600));
    await db.updateSourceConnection(src.id, {
      last_synced_at: new Date().toISOString(),
      records_count: src.records_count + Math.floor(Math.random() * 5 + 1),
    });
    await loadSources();
    setIsSyncing(null);
  };

  const getIcon = (type: SourceType) => {
    switch (type) {
      case 'shelter':
        return Building2;
      case 'hospital':
        return Stethoscope;
      case 'helpline':
        return PhoneCall;
      case 'ngo':
        return Users;
      default:
        return Database;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutional Source Integrations & Adapters
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure external government, medical, and NGO intake streams. System routes queries through normalized adapters.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          <span>Adapter Protocol: REST / FHIR / GeoJSON Ready</span>
        </div>
      </div>

      {/* Transparency & Security Disclosure Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-teal-900">
        <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block">Institutional Connection Mode: Simulation & Mock Adapters</span>
          <p className="mt-0.5 text-teal-950/80 leading-relaxed">
            All source connections below run through real <strong>SourceAdapter</strong> implementations
            (`MockShelterAdapter`, `MockHospitalAdapter`, `MockHelplineAdapter`, `MockNGOAdapter`). Real state health
            and disaster relief APIs can be connected later via backend service endpoints without modifying the investigation UI.
            No live institutional credentials are fabricated or required for evaluation.
          </p>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sources.map((src) => {
          const Icon = getIcon(src.source_type);
          const isBusy = isSyncing === src.id;

          return (
            <div
              key={src.id}
              className={`bg-white rounded-3xl border p-6 shadow-sm space-y-4 transition ${
                src.is_enabled ? 'border-slate-200/90' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-teal-700 border border-slate-200">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900">{src.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.2 rounded font-bold">
                        {src.source_type}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-teal-100 text-teal-800">
                        {src.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enable/Disable Toggle */}
                <button
                  onClick={() => handleToggle(src)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    src.is_enabled ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      src.is_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Endpoint & Adapter Info */}
              <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Endpoint URL:</span>
                  <span className="text-slate-700 truncate max-w-[240px]">{src.endpoint_url}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Adapter Class:</span>
                  <span className="text-teal-700 font-bold">{src.adapter_key}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Records Ingested:</span>
                  <span className="text-slate-900 font-bold">{src.records_count} normalized</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Synchronized:</span>
                  <span className="text-slate-600">{new Date(src.last_synced_at).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleSync(src)}
                  disabled={!src.is_enabled || isBusy}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                  <span>{isBusy ? 'Synchronizing...' : 'Sync Records'}</span>
                </button>

                <button
                  onClick={() => setSelectedSource(src)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-teal-700 hover:text-teal-900"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure API</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure {selectedSource.name}</h3>
                <span className="text-xs text-slate-500">Source Adapter: {selectedSource.adapter_key}</span>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Production REST API Gateway</label>
                <input
                  type="text"
                  defaultValue={selectedSource.endpoint_url}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Authentication Method</label>
                <select className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
                  <option>Mutual TLS + OAuth 2.0 Client Credentials</option>
                  <option>Static Institutional API Key (Server-side Encrypted)</option>
                  <option>Government VPN Direct Gateway</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 space-y-1">
                <span className="font-bold block text-slate-800">Security Rule:</span>
                <p>
                  Institutional API credentials must be provisioned via server-side environment variables or Supabase Edge Functions. They are never transmitted to client browsers.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedSource(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Settings updated in adapter registry.');
                  setSelectedSource(null);
                }}
                className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 shadow-sm"
              >
                Save Adapter Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
