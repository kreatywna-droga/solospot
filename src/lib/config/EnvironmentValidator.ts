import { z } from 'zod';

const EnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be a non-empty string'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, 'SUPABASE_SERVICE_ROLE_KEY must be a non-empty string'),
  ONEKOSZYK_SIGNATURE_KEY: z.string().min(8, 'ONEKOSZYK_SIGNATURE_KEY must be a non-empty string'),
  ENCRYPTION_KEY_32: z.string().length(32, 'ENCRYPTION_KEY_32 must be exactly 32 characters long'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
});

export class EnvironmentValidator {
  private static isValidated = false;

  public static validate(): void {
    if (this.isValidated) return;

    const result = EnvironmentSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      ONEKOSZYK_SIGNATURE_KEY: process.env.ONEKOSZYK_SIGNATURE_KEY,
      ENCRYPTION_KEY_32: process.env.ENCRYPTION_KEY_32,
      JWT_SECRET: process.env.JWT_SECRET,
    });

    if (!result.success) {
      const issues = result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Environment Validation Failed: ${issues}`);
    }

    this.isValidated = true;
  }

  public static resetForTesting(): void {
    this.isValidated = false;
  }
}
