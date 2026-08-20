import { ProvisionStage } from '../ProvisionStage';
import { ProvisionContext, extendProvisionContext } from '../ProvisionContext';
import { AuditLogger } from '../../../security/src/AuditLogger';
import { SecurityEngine } from '../../../security/src/SecurityEngine';

export class SecurityAccreditationStage implements ProvisionStage {
  readonly name = 'security-accreditation-stage';
  private readonly auditLogger: AuditLogger;
  private readonly securityEngine: SecurityEngine;

  constructor(auditLogger?: AuditLogger, securityEngine?: SecurityEngine) {
    this.auditLogger = auditLogger ?? new AuditLogger();
    this.securityEngine = securityEngine ?? new SecurityEngine({ enableRateLimiting: true, rateLimitMax: 1000 });
  }

  async execute(context: ProvisionContext): Promise<ProvisionContext> {
    const { tenantId } = context.request;

    if (context.request.metadata?.simulatedSecurityAccreditationFailure) {
      throw new Error('Simulated SecurityAccreditationStage failure during pipeline execution');
    }

    // Layer 5: Execute Security Policy & Record Audit Log
    this.auditLogger.critical(tenantId, 'STOREFRONT_SECURITY_ACCREDITED', {
      storeId: context.request.storeId,
      accreditedAt: new Date().toISOString(),
      correlationId: context.request.correlationId,
    });

    return extendProvisionContext(context, {
      metadata: {
        ...context.metadata,
        securityAccredited: true,
        securityRateLimitMax: 1000,
      },
    });
  }

  async rollback(context: ProvisionContext): Promise<ProvisionContext> {
    const { tenantId } = context.request;
    this.auditLogger.critical(tenantId, 'STOREFRONT_SECURITY_REVOKED', {
      reason: 'Stage pipeline rollback',
    });

    return extendProvisionContext(context, {
      metadata: {
        ...context.metadata,
        securityRevoked: true,
      },
    });
  }
}
