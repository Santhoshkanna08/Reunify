// REUNIFY Investigator Cases Management Page
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  FilePlus,
  ArrowRight,
  Shield,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { db } from '../../lib/supabaseClient';
import { MissingPersonCase, CaseStatus } from '../../types';

interface CasesPageProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const CasesPage: React.FC<CasesPageProps> = ({ onNavigate }) => {
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  const loadCases = async () => {
    const list = await db.getCases();
    setCases(list);
  };

  useEffect(() => {
    loadCases();
    window.addEventListener('reunify_data_changed', loadCases);
    return () => window.removeEventListener('reunify_data_changed', loadCases);
  }, []);

  const filteredCases = cases.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (districtFilter !== 'all' && c.district.toLowerCase() !== districtFilter.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.full_name.toLowerCase().includes(q);
      const matchNum = c.case_number.toLowerCase().includes(q);
      const matchDistrict = c.district.toLowerCase().includes(q);
      return matchName || matchNum || matchDistrict;
    }
    return true;
  });

  const districts = Array.from(new Set(cases.map((c) => c.district)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Missing Person Case Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registered missing person cases, monitor investigation states, and trigger evidence reconciliations.
          </p>
        </div>

        <button
          onClick={() => onNavigate('report')}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition shadow-sm self-start sm:self-auto"
        >
          <FilePlus className="w-4 h-4" />
          <span>Register New Case</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by person name, case number, or landmark..."
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
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_investigation">Under Investigation</option>
            <option value="awaiting_review">Awaiting Review</option>
            <option value="reunited">Reunited</option>
          </select>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Person Profile</th>
                <th className="py-3 px-4">Last Known Coordinate</th>
                <th className="py-3 px-4">Last Seen Timestamp</th>
                <th className="py-3 px-4">Reporter</th>
                <th className="py-3 px-4">Investigation Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No cases match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.case_number}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          {c.photo_url ? (
                            <img src={c.photo_url} alt={c.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                              {c.full_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{c.full_name}</span>
                          <span className="text-[11px] text-slate-500">
                            {c.age} yrs • {c.gender}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{c.district}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{c.last_known_location}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{c.last_seen_date}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{c.last_seen_time}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{c.reporter_name}</span>
                      <span className="text-[11px] text-slate-500">{c.reporter_relationship}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                        className="px-3 py-1.5 bg-[#0F2942] hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition shadow-sm"
                      >
                        Open Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
