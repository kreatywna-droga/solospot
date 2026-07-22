import { PlanEngine } from './PlanEngine';
import { SubscriptionEngine } from './SubscriptionEngine';
import { UsageEngine } from './UsageEngine';
import { InvoiceEngine } from './InvoiceEngine';
import { StripeGateway } from './gateways/StripeGateway';
import { BillingCycle, Invoice } from './BillingDomain';
import { PlanType } from '../../platform-identity/src/PlatformIdentity';

export interface BillingFlowContext {
  organizationId: string;
  selectedPlan: PlanType;
  billingCycle: BillingCycle;
}

export interface BillingFlowResult {
  subscriptionId: string;
  invoiceId: string;
  paymentIntentId?: string;
}

export class BillingGoldenFlow {
  constructor(
    private planEngine: PlanEngine,
    private subscriptionEngine: SubscriptionEngine,
    private usageEngine: UsageEngine,
    private invoiceEngine: InvoiceEngine,
    private paymentGateway: StripeGateway
  ) {}

  async execute(ctx: BillingFlowContext): Promise<BillingFlowResult> {
    const subscription = this.subscriptionEngine.createSubscription({
      organizationId: ctx.organizationId,
      planType: ctx.selectedPlan,
      cycle: ctx.billingCycle
    });

    const invoice = this.invoiceEngine.generateInvoice(subscription, ctx.billingCycle);

    const paymentIntent = await this.paymentGateway.createPaymentIntent(invoice);

    return {
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
      paymentIntentId: paymentIntent.id
    };
  }

  async processRenewal(organizationId: string, invoice: Invoice): Promise<void> {
    this.invoiceEngine.markPaid(invoice);
  }
}