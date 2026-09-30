// REUNIFY Privacy & Data Redaction Service
// Enforces role-based masking of Personally Identifiable Information (PII)
// Compliant with disaster humanitarian data standards.

import { MissingPersonCase, UserRole } from '../../types';

export function maskPhoneNumber(phone?: string): string {
  if (!phone) return 'Not Provided';
  const clean = phone.trim();
  if (clean.length <= 5) return '***-***';
  const prefix = clean.startsWith('+91') ? '+91-' : clean.slice(0, 3) + '-';
  const suffix = clean.slice(-4);
  return `${prefix}******${suffix}`;
}

export function maskEmail(email?: string): string {
  if (!email) return 'Not Provided';
  const [local, domain] = email.split('@');
  if (!domain) return '****@***.com';
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}****@${domain}`;
}

export function redactCaseForPublicView(c: MissingPersonCase, role: UserRole): MissingPersonCase {
  const isPrivileged = role === 'investigator' || role === 'reviewer' || role === 'admin';
  if (isPrivileged) return c;

  return {
    ...c,
    reporter_phone: maskPhoneNumber(c.reporter_phone),
    reporter_email: maskEmail(c.reporter_email),
    medical_conditions: c.medical_conditions ? '[Redacted for Public Privacy]' : undefined,
  };
}
