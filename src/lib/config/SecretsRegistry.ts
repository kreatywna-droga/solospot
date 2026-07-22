import { EnvironmentValidator } from './EnvironmentValidator';

export class SecretsRegistry {
  public static getSupabaseUrl(): string {
    EnvironmentValidator.validate();
    return process.env.NEXT_PUBLIC_SUPABASE_URL!;
  }

  public static getSupabaseAnonKey(): string {
    EnvironmentValidator.validate();
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  }

  public static getSupabaseServiceRoleKey(): string {
    EnvironmentValidator.validate();
    return process.env.SUPABASE_SERVICE_ROLE_KEY!;
  }

  public static getOneKoszykSignatureKey(): string {
    EnvironmentValidator.validate();
    return process.env.ONEKOSZYK_SIGNATURE_KEY!;
  }

  public static getEncryptionKey32(): string {
    EnvironmentValidator.validate();
    return process.env.ENCRYPTION_KEY_32!;
  }

  public static getJwtSecret(): string {
    EnvironmentValidator.validate();
    return process.env.JWT_SECRET!;
  }
}
