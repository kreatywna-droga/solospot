import { z } from 'zod';

/**
 * Zod schema for platform-wide configurations.
 * Enforces runtime types, presence, and formats of crucial settings.
 */
export const PlatformConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  buildId: z.string().min(1),
  features: z.object({
    enableImpersonationAudit: z.boolean().default(true),
    enableMultiRegionTelemetry: z.boolean().default(false),
  }),
  limits: z.object({
    maxRequestExecutionMs: z.number().int().positive().default(5000),
    defaultCacheTtlSeconds: z.number().int().nonnegative().default(300),
  }),
});

export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;

/**
 * ConfigurationManager loads environment variables, validates them against PlatformConfigSchema,
 * and exposes an immutable PlatformConfig snapshot.
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private readonly config: PlatformConfig;

  private constructor() {
    const rawConfig = {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'dev-build',
      features: {
        enableImpersonationAudit: process.env.ENABLE_IMPERSONATION_AUDIT === 'true',
        enableMultiRegionTelemetry: process.env.ENABLE_MULTI_REGION_TELEMETRY === 'true',
      },
      limits: {
        maxRequestExecutionMs: process.env.MAX_REQUEST_EXECUTION_MS 
          ? parseInt(process.env.MAX_REQUEST_EXECUTION_MS, 10) 
          : 5000,
        defaultCacheTtlSeconds: process.env.DEFAULT_CACHE_TTL_SECONDS 
          ? parseInt(process.env.DEFAULT_CACHE_TTL_SECONDS, 10) 
          : 300,
      },
    };

    const parsed = PlatformConfigSchema.safeParse(rawConfig);
    if (!parsed.success) {
      console.error('❌ Krytyczny błąd walidacji konfiguracji platformy:', parsed.error.format());
      throw new Error('Platform configuration validation failed.');
    }

    // Freeze the object recursively to prevent runtime modifications (Architecture Core DNA Rule)
    this.config = this.deepFreeze(parsed.data);
  }

  /**
   * Returns the singleton instance of ConfigurationManager.
   */
  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Resets the singleton instance for testing purposes.
   */
  public static resetInstanceForTesting(): void {
    ConfigurationManager.instance = undefined as any;
  }

  /**
   * Retrieves the immutable platform configuration object.
   */
  public get(): PlatformConfig {
    return this.config;
  }

  /**
   * Recursively freezes an object to ensure complete immutability.
   */
  private deepFreeze<T extends Record<string, any>>(obj: T): T {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      if (
        obj.hasOwnProperty(prop) &&
        obj[prop] !== null &&
        (typeof obj[prop] === 'object' || typeof obj[prop] === 'function') &&
        !Object.isFrozen(obj[prop])
      ) {
        this.deepFreeze(obj[prop]);
      }
    });
    return obj;
  }
}
