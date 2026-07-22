export interface SecurityPolicy {
  csp: string;
  rateLimit: { requests: number; windowMs: number };
  cors: { origins: string[]; credentials: boolean };
}

export interface SecurityConfig {
  id: string;
  organizationId?: string;
  policy: SecurityPolicy;
  enabled: boolean;
}