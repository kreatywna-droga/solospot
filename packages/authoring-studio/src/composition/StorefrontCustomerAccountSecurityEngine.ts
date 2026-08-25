/**
 * StorefrontCustomerAccountSecurityEngine.ts — Sprint G1-81 Customer Account Security Engine (Night Shift Level 43)
 *
 * Implements a pure TypeScript, headless customer account security hardening, password reset token validation, active session lifecycle,
 * session revocation, and brute-force authentication failure handling engine for published WEB FACTOR storefronts.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface PasswordResetTokenDTO {
  readonly tokenId: string;
  readonly customerId: string;
  readonly tokenHash: string;
  readonly expiresAt: number;
  readonly used: boolean;
}

export interface ActiveSessionDTO {
  readonly sessionId: string;
  readonly customerId: string;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly issuedAt: number;
  readonly lastActiveAt: number;
  readonly revoked: boolean;
}

export interface SecurityConfigDTO {
  readonly siteId: string;
  readonly passwordResetTokens: ReadonlyArray<PasswordResetTokenDTO>;
  readonly activeSessions: ReadonlyArray<ActiveSessionDTO>;
  readonly failedLoginAttempts: Record<string, number>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontCustomerAccountSecurityEngine {
  /**
   * Creates a default security configuration.
   */
  public static createDefaultSecurityConfig(siteId = 'default_storefront_site'): SecurityConfigDTO {
    return {
      siteId,
      passwordResetTokens: [],
      activeSessions: [],
      failedLoginAttempts: {},
      lastUpdated: Date.now()
    };
  }

  /**
   * Generates a password reset token DTO for a customer account.
   */
  public static createPasswordResetToken(config: SecurityConfigDTO, customerId: string): { config: SecurityConfigDTO; token: PasswordResetTokenDTO } {
    if (!config || !customerId) throw new Error('StorefrontCustomerAccountSecurityEngine: Config or customerId is null');

    const now = Date.now();
    const tokenId = `rst_${now}_${Math.floor(Math.random() * 1000)}`;
    const tokenHash = `hash_${tokenId}_${Math.floor(Math.random() * 10000)}`;
    const expiresAt = now + 3600 * 1000; // 1 hour expiration

    const token: PasswordResetTokenDTO = {
      tokenId,
      customerId,
      tokenHash,
      expiresAt,
      used: false
    };

    const updatedConfig: SecurityConfigDTO = {
      ...config,
      passwordResetTokens: [...config.passwordResetTokens, token],
      lastUpdated: now
    };

    return { config: updatedConfig, token };
  }

  /**
   * Validates a password reset token.
   */
  public static validatePasswordResetToken(config: SecurityConfigDTO, customerId: string, tokenHash: string): boolean {
    if (!config || !customerId || !tokenHash) return false;
    const token = config.passwordResetTokens.find(t => t.customerId === customerId && t.tokenHash === tokenHash);
    if (!token) return false;
    return !token.used && Date.now() < token.expiresAt;
  }

  /**
   * Registers an active user session upon login.
   */
  public static registerActiveSession(
    config: SecurityConfigDTO,
    customerId: string,
    ipAddress = '127.0.0.1',
    userAgent = 'WebFactorClient'
  ): { config: SecurityConfigDTO; session: ActiveSessionDTO } {
    if (!config || !customerId) throw new Error('StorefrontCustomerAccountSecurityEngine: Config or customerId is null');

    const now = Date.now();
    const sessionId = `sess_${now}_${Math.floor(Math.random() * 10000)}`;

    const session: ActiveSessionDTO = {
      sessionId,
      customerId,
      ipAddress,
      userAgent,
      issuedAt: now,
      lastActiveAt: now,
      revoked: false
    };

    const updatedConfig: SecurityConfigDTO = {
      ...config,
      activeSessions: [...config.activeSessions, session],
      lastUpdated: now
    };

    return { config: updatedConfig, session };
  }

  /**
   * Revokes all active sessions for a customer (e.g. upon password change or security alert).
   */
  public static revokeCustomerSessions(config: SecurityConfigDTO, customerId: string): SecurityConfigDTO {
    if (!config || !customerId) throw new Error('StorefrontCustomerAccountSecurityEngine: Config or customerId is null');

    const updatedSessions = config.activeSessions.map(s => (s.customerId === customerId ? { ...s, revoked: true } : s));

    return {
      ...config,
      activeSessions: updatedSessions,
      lastUpdated: Date.now()
    };
  }

  /**
   * Records a failed login attempt for brute-force protection tracking.
   */
  public static recordLoginFailure(config: SecurityConfigDTO, customerEmail: string): SecurityConfigDTO {
    if (!config || !customerEmail) throw new Error('StorefrontCustomerAccountSecurityEngine: Config or customerEmail is null');

    const email = customerEmail.toLowerCase().trim();
    const currentCount = config.failedLoginAttempts[email] || 0;

    return {
      ...config,
      failedLoginAttempts: {
        ...config.failedLoginAttempts,
        [email]: currentCount + 1
      },
      lastUpdated: Date.now()
    };
  }

  /**
   * Serializes security config to JSON string.
   */
  public static serializeSecurityConfig(config: SecurityConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores security config from JSON string.
   */
  public static restoreSecurityConfig(json: string): SecurityConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid security JSON structure');
      }
      return parsed as SecurityConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore security config: ${err.message}`);
    }
  }
}
