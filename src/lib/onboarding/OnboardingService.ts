import { PlatformEventBusImpl } from '@/../packages/platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '@/../packages/platform-core/src/logger/Logger';
import { TenantRepository } from '@/lib/tenant/TenantRepository';
import { TenantProvisioningEngine } from '@/lib/tenant/TenantProvisioningEngine';
import type {
  RegisterTenantRequest,
  RegisterTenantResponse,
  InitiateCheckoutRequest,
  InitiateCheckoutResponse,
  PackageId,
} from './OnboardingTypes';
import { PLATFORM_PACKAGES } from './OnboardingTypes';

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Tenant with email '${email}' already exists.`);
    this.name = 'DuplicateEmailError';
  }
}

export class PackageNotFoundError extends Error {
  constructor(packageId: string) {
    super(`Package '${packageId}' is not available on this platform.`);
    this.name = 'PackageNotFoundError';
  }
}

export class OnboardingService {
  private readonly tenantRepo: TenantRepository;
  private readonly provisioningEngine: TenantProvisioningEngine;
  private readonly logger: ConsolePlatformLogger;

  constructor(options: {
    tenantRepo: TenantRepository;
    provisioningEngine: TenantProvisioningEngine;
    logger: ConsolePlatformLogger;
  }) {
    this.tenantRepo = options.tenantRepo;
    this.provisioningEngine = options.provisioningEngine;
    this.logger = options.logger;
  }

  /**
   * Rejestracja nowego tenanta.
   * Tworzy rekord w bazie, generuje orderId i zwraca dane do checkoutu.
   * Tenant pozostaje w statusie CREATED do momentu opłacenia.
   */
  async registerTenant(req: RegisterTenantRequest, correlationId: string): Promise<RegisterTenantResponse> {
    const { ownerEmail, packageId, storeName } = req;

    // Walidacja pakietu
    const pkg = PLATFORM_PACKAGES[packageId as PackageId];
    if (!pkg) {
      throw new PackageNotFoundError(packageId);
    }

    // Sprawdzenie duplikatu e-mail (na poziomie aplikacji przed DB unique constraint)
    const allTenants = await this.tenantRepo.getAllTenants();
    const emailExists = allTenants.some(t => t.ownerEmail === ownerEmail);
    if (emailExists) {
      throw new DuplicateEmailError(ownerEmail);
    }

    // Generowanie identyfikatorów
    const tenantId = `tn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const checkoutOrderId = `ord_onb_${tenantId}`;

    // Tworzenie tenanta przez silnik provisioningu (publikuje Tenant.Created)
    await this.provisioningEngine.createTenant(tenantId, ownerEmail, packageId, correlationId);

    this.logger.info({
      message: `Tenant registered for onboarding: ${tenantId} (${ownerEmail}, package: ${packageId})`,
      correlationId,
      tenantId,
    });

    return {
      tenantId,
      ownerEmail,
      packageId,
      storeName,
      status: 'CREATED',
      checkoutOrderId,
      packagePriceGross: pkg.priceGross,
      currency: 'PLN',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Inicjalizacja płatności 1Koszyk za wybrany pakiet.
   * Zwraca URL do przekierowania klienta na stronę płatności.
   */
  async initiateCheckout(req: InitiateCheckoutRequest, correlationId: string): Promise<InitiateCheckoutResponse> {
    const { tenantId, packageId } = req;

    const pkg = PLATFORM_PACKAGES[packageId as PackageId];
    if (!pkg) {
      throw new PackageNotFoundError(packageId);
    }

    const tenant = await this.tenantRepo.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const orderId = `ord_onb_${tenantId}_${Date.now()}`;

    // Budowanie URL do bramki 1Koszyk
    // W produkcji: URL będzie zwracany z API 1Koszyk po inicjalizacji sesji
    const onekoszykBaseUrl = process.env.ONEKOSZYK_CHECKOUT_URL ?? 'https://sklep.1koszyk.pl/checkout';
    const partnerId = process.env.ONEKOSZYK_PARTNER_ID ?? 'partner_id';

    const params = new URLSearchParams({
      partner_id: partnerId,
      order_id: orderId,
      tenant_id: tenantId,
      amount: String(pkg.priceGross),
      currency: pkg.currency,
      product_name: `SoloSpot ${pkg.name}`,
      correlation_id: correlationId,
    });

    const paymentUrl = `${onekoszykBaseUrl}?${params.toString()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minut

    this.logger.info({
      message: `Checkout initiated for tenant: ${tenantId}, order: ${orderId}, amount: ${pkg.priceGross} PLN`,
      correlationId,
      tenantId,
    });

    return {
      tenantId,
      orderId,
      paymentUrl,
      amountGross: pkg.priceGross,
      currency: 'PLN',
      expiresAt,
    };
  }
}
