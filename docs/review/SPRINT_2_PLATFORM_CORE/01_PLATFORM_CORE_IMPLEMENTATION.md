---
Status: REVIEW
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_1_FOUNDATION/12_IMPLEMENTATION_PLAN.md
---

# SPRINT 2: PLATFORM CORE IMPLEMENTATION
## Zadanie 1 — Platform Core Specification & API Contract
*Specyfikacja techniczna, kontrakty API oraz klasy bazowe dla modułu `platform-core` stanowiącego fundament platformy WEB FACTOR.*

---

### 1. Konfiguracja Systemu (Platform Configuration Engine)

Konfiguracja platformy musi być ładowana podczas startupu aplikacji z walidacją typów na poziomie środowiska uruchomieniowego. Wykorzystujemy bibliotekę `zod` do walidacji schematu.

#### 1.1 Schemat Konfiguracji (`src/config/schema.ts`)
```typescript
import { z } from 'zod';

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
```

#### 1.2 Klasa Konfiguracyjna (`src/config/index.ts`)
```typescript
import { PlatformConfig, PlatformConfigSchema } from './schema';

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
        maxRequestExecutionMs: Number(process.env.MAX_REQUEST_EXECUTION_MS) || 5000,
        defaultCacheTtlSeconds: Number(process.env.DEFAULT_CACHE_TTL_SECONDS) || 300,
      },
    };

    const parsed = PlatformConfigSchema.safeParse(rawConfig);
    if (!parsed.success) {
      console.error('❌ Krytyczny błąd ładowania konfiguracji platformy:', parsed.error.format());
      throw new Error('Platform configuration validation failed.');
    }

    this.config = Object.freeze(parsed.data);
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  public get(): PlatformConfig {
    return this.config;
  }
}
```

---

### 2. Standard Telemetrii (Platform Logger API)

Logger platformy nie może pisać na standardowe wyjście w sposób niekontrolowany. W celach łatwej agregacji logów (np. przez AWS CloudWatch, Datadog lub Supabase Logs), logger generuje ustrukturyzowany format JSON na `stdout` (dla logów `info`/`warn`) oraz `stderr` (dla `error`/`fatal`).

#### 2.1 Struktura JSON Logu
```json
{
  "timestamp": "2026-07-10T13:46:12.123Z",
  "level": "INFO",
  "message": "Tenant resolved successfully",
  "correlationId": "req_8f31b8a9-4b62-4217",
  "causationId": "evt_0210e7b8c3d1",
  "tenantId": "store_fashion_001",
  "metadata": {
    "host": "fashion.localhost",
    "compositionTimeMs": 14
  }
}
```

#### 2.2 Klasa Loggera (`src/logger/index.ts`)
```typescript
import { PlatformLogger, LoggerPayload } from '../types';

export class ConsolePlatformLogger implements PlatformLogger {
  private formatLog(level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL', payload: LoggerPayload, error?: Error) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message: payload.message,
      correlationId: payload.correlationId,
      causationId: payload.causationId,
      tenantId: payload.tenantId,
      metadata: payload.metadata || {},
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  public info(payload: LoggerPayload): void {
    console.log(this.formatLog('INFO', payload));
  }

  public warn(payload: LoggerPayload): void {
    console.warn(this.formatLog('WARN', payload));
  }

  public error(payload: LoggerPayload & { readonly error?: Error }): void {
    console.error(this.formatLog('ERROR', payload, payload.error));
  }

  public fatal(payload: LoggerPayload & { readonly error?: Error }): void {
    console.error(this.formatLog('FATAL', payload, payload.error));
  }
}
```

---

### 3. Model Wyjątków (Platform Errors Engine)

Każdy wyjątek zgłaszany przez kod platformy musi dziedziczyć po klasie bazowej `PlatformError`. Wszelkie nieprzechwycone błędy systemowe są parsowane w Global Error Boundary i konwertowane na odpowiednie komunikaty HTTP z logowaniem w formacie telemetrycznym.

#### 3.1 Hierarchia Błędów Platformy
```text
PlatformError (Bazowa klasa)
 ├── TenantNotFoundError (Kod: TENANT_NOT_FOUND, Severity: MEDIUM)
 ├── ConfigurationError (Kod: CONFIG_VALIDATION_FAILED, Severity: FATAL)
 ├── UnauthorizedActionError (Kod: INSUFFICIENT_PERMISSIONS, Severity: HIGH)
 └── CapabilityDependencyError (Kod: DEPENDENCY_RESOLVE_FAILED, Severity: HIGH)
```

#### 3.2 Przykład Implementacji Błędu
```typescript
import { PlatformError, ErrorSeverity } from '../types';

export class TenantNotFoundError extends PlatformError {
  constructor(tenantSlug: string, correlationId: string) {
    super({
      message: `Tenant o identyfikatorze '${tenantSlug}' nie został odnaleziony w bazie danych.`,
      code: 'TENANT_NOT_FOUND',
      severity: 'MEDIUM',
      module: 'TENANT_RESOLVER',
      correlationId,
      metadata: { tenantSlug },
    });
  }
}
```

---

### 4. Diagnostyka Systemowa (Health & Readiness Engine)

Każdy komponent systemowy rejestruje swój status w module `DiagnosticsRegistry`.

```typescript
export interface DiagnosticComponent {
  readonly name: string;
  checkHealth(): Promise<{ status: 'OK' | 'CRITICAL'; message?: string }>;
}

export class DiagnosticsEngine {
  private components: DiagnosticComponent[] = [];

  public register(component: DiagnosticComponent): void {
    this.components.push(component);
  }

  public async getOverallStatus(): Promise<{
    status: 'READY' | 'UNHEALTHY';
    timestamp: string;
    details: Record<string, { status: 'OK' | 'CRITICAL'; message?: string }>;
  }> {
    const details: Record<string, { status: 'OK' | 'CRITICAL'; message?: string }> = {};
    let isHealthy = true;

    for (const comp of this.components) {
      try {
        const res = await comp.checkHealth();
        details[comp.name] = res;
        if (res.status === 'CRITICAL') {
          isHealthy = false;
        }
      } catch (err) {
        isHealthy = false;
        details[comp.name] = {
          status: 'CRITICAL',
          message: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    }

    return {
      status: isHealthy ? 'READY' : 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      details,
    };
  }
}
```
