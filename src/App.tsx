/**
 * REUNIFY — Missing Persons & Family Reunification
 * "Reconnect people. Reconcile evidence. Restore certainty."
 * HackSprint '26 DM-05
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { Navigation } from './components/Navigation';
import { InvestigatorNav } from './components/InvestigatorNav';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ReportCasePage } from './pages/public/ReportCasePage';
import { TrackCasePage } from './pages/public/TrackCasePage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { ResourcesPage } from './pages/public/ResourcesPage';

// Investigator Pages
import { OverviewDashboard } from './pages/investigator/OverviewDashboard';
import { CasesPage } from './pages/investigator/CasesPage';
import { CaseDetailPage } from './pages/investigator/CaseDetailPage';
import { CandidatesPage } from './pages/investigator/CandidatesPage';
import { ReviewPage } from './pages/investigator/ReviewPage';
import { SourcesPage } from './pages/investigator/SourcesPage';
import { AuditLogsPage } from './pages/investigator/AuditLogsPage';
import { SettingsPage } from './pages/investigator/SettingsPage';

import { Shield, Heart, Lock, AlertCircle, Phone } from 'lucide-react';

function AppContent() {
  const { role, isInvestigatorOrAbove } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>('case-arun-001');

  // Handle URL hash or query params if any
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        if (hash.startsWith('track=')) {
          setSelectedCaseId(hash.split('=')[1]);
          setCurrentTab('track');
        } else if (hash.startsWith('case=')) {
          setSelectedCaseId(hash.split('=')[1]);
          setCurrentTab('inv_case_detail');
        } else {
          setCurrentTab(hash);
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (tab: string, caseId?: string) => {
    if (caseId) {
      setSelectedCaseId(caseId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isInvestigatorView = currentTab.startsWith('inv_');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans">
      {/* Primary Navigation & Role Bar */}
      <Navigation currentTab={currentTab} onNavigate={handleNavigate} />

      {/* Investigator Portal Sub-navigation Bar */}
      {isInvestigatorView && (
        <InvestigatorNav currentTab={currentTab} onNavigate={handleNavigate} />
      )}

      {/* Main Page Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* PUBLIC PAGES */}
        {currentTab === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentTab === 'report' && <ReportCasePage onNavigate={handleNavigate} />}
        {currentTab === 'track' && (
          <TrackCasePage initialCaseId={selectedCaseId} onNavigate={handleNavigate} />
        )}
        {currentTab === 'how_it_works' && <HowItWorksPage />}
        {currentTab === 'resources' && <ResourcesPage />}

        {/* INVESTIGATOR PAGES */}
        {currentTab === 'inv_overview' && <OverviewDashboard onNavigate={handleNavigate} />}
        {currentTab === 'inv_cases' && <CasesPage onNavigate={handleNavigate} />}
        {currentTab === 'inv_case_detail' && (
          <CaseDetailPage
            caseId={selectedCaseId || 'case-arun-001'}
            onNavigate={handleNavigate}
          />
        )}
        {currentTab === 'inv_candidates' && <CandidatesPage onNavigate={handleNavigate} />}
        {currentTab === 'inv_reviews' && (
          <ReviewPage initialCaseId={selectedCaseId} onNavigate={handleNavigate} />
        )}
        {currentTab === 'inv_sources' && <SourcesPage />}
        {currentTab === 'inv_audit' && <AuditLogsPage />}
        {currentTab === 'inv_settings' && <SettingsPage />}
      </main>

      {/* Application Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F2942] flex items-center justify-center text-teal-400">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-slate-900">REUNIFY</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Missing Persons & Family Reunification Platform. Reconciles records across shelters, hospitals, helplines, and NGOs with deterministic verification and mandatory human confirmation.
              </p>
              <div className="inline-flex items-center text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-200">
                <Lock className="w-3 h-3 mr-1" /> Family PII Protection Active
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-900 uppercase tracking-wider block mb-3">
                Public Services
              </span>
              <ul className="space-y-2 text-slate-600 font-medium">
                <li>
                  <button onClick={() => handleNavigate('report')} className="hover:text-teal-700 transition">
                    Report a Missing Person
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate('track')} className="hover:text-teal-700 transition">
                    Search Case Status
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate('how_it_works')} className="hover:text-teal-700 transition">
                    How Evidence Reconciliation Works
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate('resources')} className="hover:text-teal-700 transition">
                    Emergency Toll-Free Resources
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-slate-900 uppercase tracking-wider block mb-3">
                Investigator Desk
              </span>
              <ul className="space-y-2 text-slate-600 font-medium">
                <li>
                  <button onClick={() => handleNavigate('inv_overview')} className="hover:text-teal-700 transition">
                    Command Overview
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate('inv_case_detail', 'case-arun-001')} className="hover:text-teal-700 transition">
                    Arun Kumar Case Cockpit
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate('inv_reviews')} className="hover:text-teal-700 transition">
                    Human Review Desk
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate('inv_sources')} className="hover:text-teal-700 transition">
                    Institutional Adapters
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate('inv_audit')} className="hover:text-teal-700 transition">
                    Immutable Audit Trail
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate('inv_settings')} className="hover:text-teal-700 transition">
                    Supabase PostgreSQL Settings
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-slate-900 uppercase tracking-wider block mb-3">
                Disaster Helplines
              </span>
              <div className="space-y-2 text-slate-600">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">State Control Room</span>
                  <span className="text-sm font-extrabold text-teal-800 font-mono">1070 (Toll-Free)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">District Triage</span>
                  <span className="text-sm font-extrabold text-teal-800 font-mono">1077</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center space-x-2">
              <span>HACKSPRINT &apos;26 • Challenge DM-05: Missing Persons & Family Reunification</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">All demonstration data marked: synthetic</span>
            </div>

            <div className="font-semibold text-slate-700 text-center sm:text-right">
              THE LLM REASONS. THE SYSTEM VERIFIES. THE HUMAN DECIDES.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
