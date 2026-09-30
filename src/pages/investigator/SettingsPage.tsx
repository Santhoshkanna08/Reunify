// REUNIFY System Settings, Supabase Connection & Database Utilities
import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Key,
  Copy,
  Check,
  FileCode,
} from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, db } from '../../lib/supabaseClient';

export const SettingsPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [sqlDump, setSqlDump] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    const cfg = getSupabaseConfig();
    setUrl(cfg.url);
    setAnonKey(cfg.anonKey);
    setIsConnected(cfg.isConnected);
  }, []);

  const handleSaveConfig = () => {
    saveSupabaseConfig(url, anonKey);
    const cfg = getSupabaseConfig();
    setIsConnected(cfg.isConnected);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all cases and candidates to the initial Arun Madurai scenario?')) {
      db.resetToSeed();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    }
  };

  const handleExportSql = async () => {
    const dump = await db.exportAsSQL();
    setSqlDump(dump);
  };

  const copySql = () => {
    navigator.clipboard.writeText(sqlDump);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          System Settings & Database Architecture
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure external Supabase PostgreSQL sync, inspect SQL migrations, or reset synthetic demonstration scenarios.
        </p>
      </div>

      {/* Supabase PostgreSQL Configuration */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Supabase Cloud PostgreSQL Connection</h2>
              <p className="text-xs text-slate-500">
                Connect your live Supabase database or use the built-in persistent relational engine.
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              isConnected
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-teal-50 text-teal-800 border-teal-200'
            }`}
          >
            {isConnected ? 'Connected to Cloud Supabase' : 'Active: In-Memory / Local DB'}
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">VITE_SUPABASE_URL</label>
            <input
              type="text"
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">VITE_SUPABASE_ANON_KEY</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed">
            <strong>Zero Setup Required:</strong> The application functions completely out of the box with zero runtime errors. Every case you create and every investigation step is persisted in the local relational store. Enter your Supabase credentials if you wish to replicate data to the cloud.
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 flex items-center">
              <Check className="w-4 h-4 mr-1" /> Configuration saved successfully!
            </span>
          )}
          <button
            onClick={handleSaveConfig}
            className="ml-auto px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Save Supabase Credentials
          </button>
        </div>
      </div>

      {/* AI Provider & Privacy Architecture */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">AI Provider & Tool Allowlist Configuration</h2>
            <p className="text-xs text-slate-500">
              Provider abstraction layer (Gemini API / Groq compatible)
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong>Core Security Rule:</strong> Private AI API keys and database service roles are never exposed to the frontend.
          </p>
          <p>
            The autonomous investigation planner dispatches calls <em>exclusively</em> to allowlisted tools:{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-800 font-mono font-semibold">search_shelter</code>,{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-800 font-mono font-semibold">search_hospital</code>,{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-800 font-mono font-semibold">search_helpline</code>, and{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-800 font-mono font-semibold">search_ngo</code>.
          </p>
          <p>
            Scoring calculations are executed by the deterministic mathematical engine rather than the LLM.
          </p>
        </div>
      </div>

      {/* Data Management & Seed Reset */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Synthetic Scenario Data Management</h2>
            <p className="text-xs text-slate-500">
              Restore the flagship Arun Madurai case scenario and multi-district test datasets.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Clicking reset restores the database to pristine synthetic fixtures: Arun Kumar (Madurai flood case with 180 km/h wristband contradiction), Priya Sundaram (Trichy NGO candidate), and others.
        </p>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleResetData}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>Reset Database to Pristine Arun Scenario</span>
          </button>
          {resetDone && (
            <span className="text-xs font-bold text-emerald-700 flex items-center">
              <Check className="w-4 h-4 mr-1" /> Reset completed!
            </span>
          )}
        </div>
      </div>

      {/* SQL Migration & Schema Export */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">SQL Schema & Live Data Dump</h2>
              <p className="text-xs text-slate-500">
                Download or copy PostgreSQL DDL migration statements and INSERT records.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportSql}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate SQL Dump</span>
          </button>
        </div>

        {sqlDump ? (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button
                onClick={copySql}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-teal-300 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-72">
              {sqlDump}
            </pre>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Click &quot;Generate SQL Dump&quot; to export your active cases, candidates, and audit records into PostgreSQL insert queries.
          </p>
        )}
      </div>
    </div>
  );
};
