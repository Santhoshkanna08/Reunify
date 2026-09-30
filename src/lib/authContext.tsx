// REUNIFY Authentication & Role-Based Access Control Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Profile } from '../types';

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: Profile;
  isInvestigatorOrAbove: boolean;
  isReviewerOrAbove: boolean;
  isAdmin: boolean;
  switchRole: (role: UserRole) => void;
}

const DEFAULT_PROFILES: Record<UserRole, Profile> = {
  public: {
    id: 'user-pub-01',
    full_name: 'Public Visitor',
    email: 'visitor@public.reunify.gov',
    role: 'public',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  reporter: {
    id: 'user-rep-01',
    full_name: 'Suresh Kumar',
    email: 'suresh.k.madurai@gmail.com',
    role: 'reporter',
    phone: '+91-98401-84729',
    agency: 'Family Reporter',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  investigator: {
    id: 'user-inv-01',
    full_name: 'Inspector Anand R.',
    email: 'anand.r@tnsdma.gov.in',
    role: 'investigator',
    badge_number: 'TN-SDMA-8419',
    agency: 'State Disaster Management Authority (SDMA)',
    phone: '+91-94421-99881',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  reviewer: {
    id: 'user-rev-01',
    full_name: 'Dr. V. Radhakrishnan',
    email: 'dr.radha@health.gov.in',
    role: 'reviewer',
    badge_number: 'REV-LEAD-004',
    agency: 'Inter-Agency Forensic & Reunification Board',
    phone: '+91-98400-11223',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  admin: {
    id: 'user-adm-01',
    full_name: 'Commissioner Selvaraj IAS',
    email: 'selvaraj.admin@disaster.tn.gov.in',
    role: 'admin',
    badge_number: 'ADMIN-SDMA-01',
    agency: 'Disaster Command & Coordination Headquarters',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('reunify_current_role');
    return (saved as UserRole) || 'investigator'; // Default to investigator so reviewers can explore immediately
  });

  const currentUser = DEFAULT_PROFILES[role] || DEFAULT_PROFILES.investigator;

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('reunify_current_role', newRole);
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  useEffect(() => {
    localStorage.setItem('reunify_current_role', role);
  }, [role]);

  const isInvestigatorOrAbove = role === 'investigator' || role === 'reviewer' || role === 'admin';
  const isReviewerOrAbove = role === 'reviewer' || role === 'admin';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        isInvestigatorOrAbove,
        isReviewerOrAbove,
        isAdmin,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
