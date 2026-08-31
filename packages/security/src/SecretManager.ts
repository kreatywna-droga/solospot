import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, 'webfactor-secretmanager-salt', KEY_LENGTH);
}

function encryptValue(plaintext: string, masterKey: string): string {
  const key = deriveKey(masterKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), enc.toString('base64')].join('.');
}

function decryptValue(payload: string, masterKey: string): string | null {
  try {
    const [ivB64, tagB64, encB64] = payload.split('.');
    if (!ivB64 || !tagB64 || !encB64) return null;
    const key = deriveKey(masterKey);
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const enc = Buffer.from(encB64, 'base64');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return null;
  }
}

export interface SecretManagerOptions {
  masterKey?: string;
}

export class SecretManager {
  private readonly secrets: Map<string, string> = new Map();
  private readonly masterKey: string;

  constructor(options: SecretManagerOptions = {}) {
    this.masterKey = options.masterKey ?? process.env['SECRET_MANAGER_MASTER_KEY'] ?? 'dev-only-not-for-production';
  }

  set(tenantId: string, key: string, value: string): void {
    if (!tenantId) throw new Error('SecretManager.set requires tenantId');
    if (!key) throw new Error('SecretManager.set requires key');
    const namespaced = this.namespacedKey(tenantId, key);
    this.secrets.set(namespaced, encryptValue(value, this.masterKey));
  }

  get(tenantId: string, key: string): string | undefined {
    if (!tenantId) return undefined;
    if (!key) return undefined;
    const namespaced = this.namespacedKey(tenantId, key);
    const payload = this.secrets.get(namespaced);
    if (!payload) return undefined;
    return decryptValue(payload, this.masterKey) ?? undefined;
  }

  delete(tenantId: string, key: string): boolean {
    if (!tenantId) return false;
    return this.secrets.delete(this.namespacedKey(tenantId, key));
  }

  has(tenantId: string, key: string): boolean {
    if (!tenantId) return false;
    return this.secrets.has(this.namespacedKey(tenantId, key));
  }

  listKeys(tenantId: string): string[] {
    if (!tenantId) return [];
    const prefix = `${tenantId}:`;
    const out: string[] = [];
    for (const k of this.secrets.keys()) {
      if (k.startsWith(prefix)) out.push(k.substring(prefix.length));
    }
    return out;
  }

  private namespacedKey(tenantId: string, key: string): string {
    return `${tenantId}:${key}`;
  }
}

export { SecretManager as TenantScopedSecretManager };
