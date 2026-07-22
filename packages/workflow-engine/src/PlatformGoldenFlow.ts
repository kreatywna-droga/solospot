import { PlatformContextResolver } from '../../platform-identity/src/PlatformContextResolver';
import { PlanType } from '../../platform-identity/src/PlatformIdentity';
import { BillingGoldenFlow } from '../../billing-core/src/BillingGoldenFlow';
import { DomainManager } from '../../domain-manager/src/DomainManager';
import { NotificationCenter } from '../../notification-center/src/NotificationCenter';
import { WorkflowRuntime } from './WorkflowRuntime';
import { BillingCycle } from '../../billing-core/src/BillingDomain';

export class PlatformGoldenFlow {
  constructor(
    private contextResolver: PlatformContextResolver,
    private billingFlow: BillingGoldenFlow,
    private domainManager: DomainManager,
    private notificationCenter: NotificationCenter,
    private workflowRuntime: WorkflowRuntime
  ) {}

  async execute(params: {
    organizationId: string;
    workspaceId: string;
    tenantId: string;
    planType: PlanType;
    domain?: string;
  }): Promise<{
    subscriptionId: string;
    invoiceId: string;
    domainId?: string;
    executionId?: string;
  }> {
    const context = this.contextResolver.resolvePlatformContext(params.tenantId);

    if (!context) {
      throw new Error('Cannot resolve platform context');
    }

    const billingResult = await this.billingFlow.execute({
      organizationId: params.organizationId,
      selectedPlan: params.planType,
      billingCycle: BillingCycle.MONTHLY
    });

    let domainId: string | undefined;
    if (params.domain && context.capabilities.customDomains) {
      const domain = this.domainManager.createDomain(params.tenantId, params.domain);
      domainId = domain?.id;
    }

    return {
      subscriptionId: billingResult.subscriptionId,
      invoiceId: billingResult.invoiceId,
      domainId
    };
  }
}