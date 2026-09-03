/**
 * requireAdmin.ts — RBAC guard for admin/mission-control routes.
 *
 * SECURITY: Replaces the weak email-substring-based role determination with
 * a proper authorization check. Admin access is granted only to:
 *
 * 1. Users whose email is listed in the ADMIN_EMAILS environment variable
 *    (comma-separated list).
 * 2. Users whose email matches the platform owner pattern (configurable).
 *
 * In production, ADMIN_EMAILS MUST be configured. Without it, no user
 * can access admin routes (fail-closed).
 */

import { resolveTenantSession } from '@/lib/tenant/TenantResolver';

export interface AdminAuthResult {
  authorized: boolean;
  userId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'SUPPORT';
  error?: string;
}

/**
 * Checks whether the current session has admin authorization.
 * Returns an AdminAuthResult with authorization status and role.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await resolveTenantSession();

  if (!session.isAuthenticated || !session.email) {
    return {
      authorized: false,
      userId: '',
      email: '',
      role: 'SUPPORT',
      error: 'Unauthorized: authentication required',
    };
  }

  const email = session.email.toLowerCase();

  // Check against configured admin emails (fail-closed if not set)
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (!adminEmailsEnv) {
    return {
      authorized: false,
      userId: session.userId,
      email: session.email,
      role: 'SUPPORT',
      error: 'Forbidden: ADMIN_EMAILS not configured',
    };
  }

  const adminEmails = adminEmailsEnv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(email)) {
    return {
      authorized: false,
      userId: session.userId,
      email: session.email,
      role: 'SUPPORT',
      error: 'Forbidden: insufficient permissions',
    };
  }

  // Determine role from the admin list position (first = OWNER, rest = ADMIN)
  const role = adminEmails.indexOf(email) === 0 ? 'OWNER' : 'ADMIN';

  return {
    authorized: true,
    userId: session.userId,
    email: session.email,
    role,
  };
}
