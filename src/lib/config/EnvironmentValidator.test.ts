import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnvironmentValidator } from './EnvironmentValidator';
import { SecretsRegistry } from './SecretsRegistry';

describe('EnvironmentValidator and SecretsRegistry', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    EnvironmentValidator.resetForTesting();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('Should validate successfully when all required environment variables are set correctly', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://valid-supabase.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-with-enough-characters-123';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-with-enough-characters-123';
    process.env.ONEKOSZYK_SIGNATURE_KEY = 'signature-key-length-123';
    process.env.ENCRYPTION_KEY_32 = '12345678901234567890123456789012'; // exactly 32 chars
    process.env.JWT_SECRET = 'jwt-signing-secret-length-123';

    expect(() => EnvironmentValidator.validate()).not.toThrow();
    expect(SecretsRegistry.getSupabaseUrl()).toBe('https://valid-supabase.supabase.co');
  });

  it('Should fail validation if any environment variable is missing or has incorrect length', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url'; // Invalid URL format
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'short';
    process.env.ONEKOSZYK_SIGNATURE_KEY = 'signature';
    process.env.ENCRYPTION_KEY_32 = 'too-short'; // Must be 32 chars
    process.env.JWT_SECRET = 'jwt';

    expect(() => EnvironmentValidator.validate()).toThrowError(/Environment Validation Failed/);
  });
});
