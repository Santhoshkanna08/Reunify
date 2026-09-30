// REUNIFY Immutable Audit Logs Page
// Real database audit trail for forensic accountability.

import React, { useState, useEffect } from 'react';
import { History, Search, Shield, Filter, Eye, Lock, FileText, Check } from 'lucide-react';
import { db } from '../../lib/supabaseClient';
import { AuditLog } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog[] | null>(null);
  const [activeModalLog, setActiveModalLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    const list = await db.getAuditLogs();
    setLogs(list);
  };

  useEffect(() => {
    loadLogs();
    window.addEventListener('reunify_data_changed', loadLogs);
    return () => window.removeEventListener('reunify_data_changed', loadLogs);
  }, []);

  const filtered = logs.filter((l) => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchActor = l.actor_name.toLowerCase().includes(q);
      const matchAction = l.action.toLowerCase().includes(q);
      const matchCase = l.case_id?.toLowerCase().includes(q);
      return matchActor || matchAction || matchCase;
    }
    return true;
  });

  const actions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Immutable Audit Trail & Forensics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed and append-only activity records. Complies with international disaster response standards.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
          <Lock className="w-3.5 h-3.5 text-teal-600" />
          <span>PostgreSQL Append-Only RLS Enforced</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor name, action type, or case ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full md:w-auto"
        >
          <option value="all">All Actions ({actions.length})</option>
          {actions.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">IP / Host</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No audit records match the query.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-4 font-mono text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{log.actor_name}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action.includes('human') || log.action.includes('decision')
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action.includes('contradiction')
                            ? 'bg-rose-100 text-rose-800'
                            : log.action.includes('reflected')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{log.entity_type}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">{log.ip_address}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setActiveModalLog(log)}
                        className="p-1 text-slate-400 hover:text-slate-800 transition"
                        title="View Full Metadata Payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Metadata Detail Modal */}
      {activeModalLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Audit Record Inspector</h3>
                <span className="text-xs text-slate-500 font-mono">ID: {activeModalLog.id}</span>
              </div>
              <button
                onClick={() => setActiveModalLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">ACTION:</span>
                  <strong>{activeModalLog.action}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">ACTOR:</span>
                  <strong>{activeModalLog.actor_name} ({activeModalLog.actor_role})</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">TIMESTAMP:</span>
                  <span>{activeModalLog.created_at}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">HOST/IP:</span>
                  <span>{activeModalLog.ip_address}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Metadata Payload:</span>
                <pre className="p-3 bg-slate-900 text-teal-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56">
                  {JSON.stringify(activeModalLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModalLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
