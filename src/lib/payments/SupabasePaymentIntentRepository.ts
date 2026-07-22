import type { PaymentProviderType } from './PaymentProviderEvent';
import { getServiceSupabase } from '@/lib/supabase';
import type { PaymentIntentRecord, PaymentIntentRepository } from './PaymentIntentRepository';
import { PaymentIntentNotFoundException as NotFound } from './PaymentIntentRepository';


export class SupabasePaymentIntentRepository implements PaymentIntentRepository {
  private readonly table = 'payment_intents';

  async findByProviderTransactionId(params: {
    tenantId: string;
    provider: PaymentProviderType;
    transactionId: string;
  }): Promise<PaymentIntentRecord | null> {
    const supabase = getServiceSupabase();

    const { tenantId, provider, transactionId } = params;

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', provider)
      .eq('provider_transaction_id', transactionId)
      .maybeSingle();

    if (error) {
      throw new Error(`SupabasePaymentIntentRepository.findByProviderTransactionId failed: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: String(data.id),
      tenantId: String(data.tenant_id),
      provider: data.provider as PaymentProviderType,
      providerTransactionId: String(data.provider_transaction_id),
      orderId: data.order_id == null ? undefined : String(data.order_id),
      status: (data.status as any) as any,
    };
  }

  // Convenience helper if callers want to throw.
  async getOrThrow(params: {
    tenantId: string;
    provider: PaymentProviderType;
    transactionId: string;
  }): Promise<PaymentIntentRecord> {
    const found = await this.findByProviderTransactionId(params);
    if (!found) {
      throw new NotFound(
        `PaymentIntent not found for tenantId=${params.tenantId}, provider=${params.provider}, transactionId=${params.transactionId}`
      );
    }
    return found;
  }
}

