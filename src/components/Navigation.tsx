// REUNIFY Main Navigation & Role Switcher
import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  FilePlus,
  Compass,
  BookOpen,
  LifeBuoy,
  Bell,
  UserCheck,
  ChevronDown,
  Layers,
  Sparkles,
  Lock,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { UserRole, NotificationItem } from '../types';
import { db } from '../lib/supabaseClient';

interface NavigationProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onNavigate }) => {
  const { role, switchRole, currentUser, isInvestigatorOrAbove } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifs = async () => {
    const list = await db.getNotifications();
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifs();
    const handleDataChange = () => loadNotifs();
    window.addEventListener('reunify_data_changed', handleDataChange);
    return () => window.removeEventListener('reunify_data_changed', handleDataChange);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    await db.markNotificationRead(id);
    loadNotifs();
  };

  const rolesList: { id: UserRole; label: string; desc: string; color: string }[] = [
    {
      id: 'public',
      label: 'Public Citizen',
      desc: 'Can file reports & track status anonymously',
      color: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'reporter',
      label: 'Family Reporter',
      desc: 'Submits detailed missing person claims',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'investigator',
      label: 'Investigator',
      desc: 'Runs autonomous pipeline & evidence audits',
      color: 'bg-teal-100 text-teal-800',
    },
    {
      id: 'reviewer',
      label: 'Human Reviewer',
      desc: 'Authorizes official matches & forensic sign-off',
      color: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'admin',
      label: 'System Admin',
      desc: 'Manages API adapters & full database export',
      color: 'bg-purple-100 text-purple-800',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      {/* Top emergency hotline / role announcement bar */}
      <div className="bg-[#0F2942] text-white text-[11px] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="flex items-center font-medium text-teal-300">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block mr-1.5 animate-pulse" />
              State Disaster Relief Command Mode Active
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-300">
              National Distress Helpline: <strong className="text-white">1070</strong> / Madurai District: <strong className="text-white">1077</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-2.5 py-0.5 rounded-full border border-slate-700 transition"
              >
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Role:</span>
                <span className="font-bold text-teal-300 capitalize">{role}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900 block">Switch Stakeholder Role</span>
                    <span className="text-[11px] text-slate-500">
                      Explore app behavior through different access levels
                    </span>
                  </div>
                  <div className="py-1 space-y-1">
                    {rolesList.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          switchRole(r.id);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                          role === r.id ? 'bg-teal-50 text-teal-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${r.color}`}>
                              {r.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{r.desc}</span>
                        </div>
                        {role === r.id && <Check className="w-4 h-4 text-teal-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center text-slate-300 font-medium">
              <Lock className="w-3 h-3 text-teal-400 mr-1" />
              <span className="hidden md:inline">Privacy Masked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-3 text-left focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0F2942] flex items-center justify-center text-white shadow-md group-hover:bg-teal-800 transition">
              <Shield className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">REUNIFY</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                  v1.0 Prod
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Reconnect people. Reconcile evidence. Restore certainty.
              </p>
            </div>
          </button>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg transition ${
                currentTab === 'home'
                  ? 'text-teal-700 bg-teal-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('how_it_works')}
              className={`px-3 py-2 rounded-lg transition ${
                currentTab === 'how_it_works'
                  ? 'text-teal-700 bg-teal-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigate('report')}
              className={`px-3 py-2 rounded-lg transition ${
                currentTab === 'report'
                  ? 'text-teal-700 bg-teal-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Report Missing Person
            </button>
            <button
              onClick={() => onNavigate('track')}
              className={`px-3 py-2 rounded-lg transition ${
                currentTab === 'track'
                  ? 'text-teal-700 bg-teal-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Track Case
            </button>
            <button
              onClick={() => onNavigate('resources')}
              className={`px-3 py-2 rounded-lg transition ${
                currentTab === 'resources'
                  ? 'text-teal-700 bg-teal-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Resources
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2.5">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 text-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-bold text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.2 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowNotifs(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto py-2 divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No notifications at this time.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`p-2.5 rounded-xl cursor-pointer text-xs transition ${
                            n.is_read ? 'opacity-70 hover:bg-slate-50' : 'bg-teal-50/50 hover:bg-teal-50 font-medium'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-bold text-slate-900">{n.title}</span>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1 ml-2" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Portal Switcher Button */}
            {isInvestigatorOrAbove ? (
              <button
                onClick={() => onNavigate(currentTab.startsWith('inv_') ? 'home' : 'inv_overview')}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm bg-[#0F2942] text-white hover:bg-slate-800"
              >
                <Layers className="w-4 h-4 text-teal-400" />
                <span>{currentTab.startsWith('inv_') ? 'Exit Portal' : 'Investigator Portal'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  switchRole('investigator');
                  onNavigate('inv_overview');
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                <UserCheck className="w-4 h-4 text-slate-500" />
                <span>Investigator Login</span>
              </button>
            )}

            {/* Primary Report CTA */}
            <button
              onClick={() => onNavigate('report')}
              className="hidden lg:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition shadow-sm shadow-teal-600/20"
            >
              <FilePlus className="w-4 h-4" />
              <span>Report Missing Person</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
