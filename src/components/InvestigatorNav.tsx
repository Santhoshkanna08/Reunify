// REUNIFY Investigator Portal Navigation Bar
import React from 'react';
import {
  LayoutDashboard,
  Users,
  Compass,
  GitMerge,
  FileCheck2,
  Database,
  History,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';

interface InvestigatorNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const InvestigatorNav: React.FC<InvestigatorNavProps> = ({ currentTab, onNavigate }) => {
  const { role, currentUser, isReviewerOrAbove, isAdmin } = useAuth();

  const links = [
    { id: 'inv_overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inv_cases', label: 'Cases', icon: Users },
    { id: 'inv_candidates', label: 'Candidates', icon: GitMerge },
    { id: 'inv_reviews', label: 'Human Review', icon: FileCheck2 },
    { id: 'inv_sources', label: 'Sources', icon: Database },
    { id: 'inv_audit', label: 'Audit Trail', icon: History },
    { id: 'inv_settings', label: 'Settings & Supabase', icon: Settings },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:h-14 gap-2">
          {/* User Agency Credentials */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="font-bold text-slate-200">{currentUser.full_name}</span>
            <span className="text-slate-500 font-mono">[{currentUser.badge_number || currentUser.role}]</span>
            <span className="hidden md:inline text-slate-400">• {currentUser.agency || 'SDMA Triage'}</span>
          </div>

          {/* Sub Navigation Items */}
          <div className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-teal-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
