/**
 * StorefrontContentSecurityPolicyEngine.ts — Sprint G1-130 Content Security Policy & Nonce Engine (Night Shift Level 92)
 *
 * Provides pure TypeScript, headless HTTP Content Security Policy (CSP) directive generation,
 * per-request script nonce generation, domain whitelist policies, and report-only evaluation.
 *
 * External WAF & Edge CDN header dispatchers (Cloudflare, Fastly) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export interface CspDirectivesDTO {
  readonly defaultSrc: ReadonlyArray<string>;
  readonly scriptSrc: ReadonlyArray<string>;
  readonly styleSrc: ReadonlyArray<string>;
  readonly imgSrc: ReadonlyArray<string>;
  readonly connectSrc: ReadonlyArray<string>;
  readonly frameAncestors: ReadonlyArray<string>;
  readonly reportUri?: string;
}

export interface CspEvaluationResultDTO {
  readonly tenantId: string;
  readonly siteId: string;
  readonly requestNonce: string;
  readonly cspHeaderValue: string;
  readonly isReportOnly: boolean;
  readonly generatedAtMs: number;
}

export interface ContentSecurityPolicyEngineStateDTO {
  readonly tenantId: string;
  readonly isReportOnly: boolean;
  readonly directives: CspDirectivesDTO;
}

export class StorefrontContentSecurityPolicyEngine {
  private readonly tenantId: string;
  private isReportOnly: boolean;
  private directives: CspDirectivesDTO;

  constructor(tenantId = 'default_tenant', isReportOnly = false) {
    this.tenantId = tenantId;
    this.isReportOnly = isReportOnly;
    this.directives = {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"]
    };
  }

  /**
   * Configures CSP directive whitelists for the published storefront site.
   */
  public updateDirectives(directives: Partial<CspDirectivesDTO>): CspDirectivesDTO {
    this.directives = {
      defaultSrc: directives.defaultSrc ? [...directives.defaultSrc] : this.directives.defaultSrc,
      scriptSrc: directives.scriptSrc ? [...directives.scriptSrc] : this.directives.scriptSrc,
      styleSrc: directives.styleSrc ? [...directives.styleSrc] : this.directives.styleSrc,
      imgSrc: directives.imgSrc ? [...directives.imgSrc] : this.directives.imgSrc,
      connectSrc: directives.connectSrc ? [...directives.connectSrc] : this.directives.connectSrc,
      frameAncestors: directives.frameAncestors ? [...directives.frameAncestors] : this.directives.frameAncestors,
      reportUri: directives.reportUri ? directives.reportUri.trim() : this.directives.reportUri
    };
    return this.directives;
  }

  /**
   * Generates a strict, per-request nonce token and formats the formatted Content-Security-Policy HTTP header string.
   */
  public buildCspHeader(siteId: string): CspEvaluationResultDTO {
    if (!siteId) {
      throw new Error('siteId is required');
    }

    const now = Date.now();
    const requestNonce = `nonce_${now}_${Math.random().toString(36).substring(2, 10)}`;

    // Sanitize CRLF injection in directive strings (G1-144 HARDEN)
    const sanitize = (str: string) => str.replace(/[\r\n]/g, '').trim();

    const scriptSrcWithNonce = [...this.directives.scriptSrc.map(sanitize), `'nonce-${requestNonce}'`].join(' ');
    const parts: string[] = [
      `default-src ${this.directives.defaultSrc.map(sanitize).join(' ')}`,
      `script-src ${scriptSrcWithNonce}`,
      `style-src ${this.directives.styleSrc.map(sanitize).join(' ')}`,
      `img-src ${this.directives.imgSrc.map(sanitize).join(' ')}`,
      `connect-src ${this.directives.connectSrc.map(sanitize).join(' ')}`,
      `frame-ancestors ${this.directives.frameAncestors.map(sanitize).join(' ')}`,
      "object-src 'none'",
      "base-uri 'self'",
      "upgrade-insecure-requests"
    ];

    if (this.directives.reportUri) {
      parts.push(`report-uri ${sanitize(this.directives.reportUri)}`);
    }

    const cspHeaderValue = parts.join('; ');

    return {
      tenantId: this.tenantId,
      siteId: siteId.trim(),
      requestNonce,
      cspHeaderValue,
      isReportOnly: this.isReportOnly,
      generatedAtMs: now
    };
  }


  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): ContentSecurityPolicyEngineStateDTO {
    return {
      tenantId: this.tenantId,
      isReportOnly: this.isReportOnly,
      directives: this.directives
    };
  }

  public importState(state: ContentSecurityPolicyEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.isReportOnly = state.isReportOnly;
    this.directives = state.directives;
  }
}
