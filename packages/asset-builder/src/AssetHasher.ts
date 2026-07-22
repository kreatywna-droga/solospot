import * as crypto from 'crypto';

export interface AssetHasher {
  hash(content: string | Uint8Array): string;
  fingerprint(filename: string, hash: string): string;
}

export class CryptoAssetHasher implements AssetHasher {
  hash(content: string | Uint8Array): string {
    const data = typeof content === 'string' ? content : Buffer.from(content);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  fingerprint(filename: string, hash: string): string {
    const parts = filename.split('.');
    if (parts.length <= 1) {
      return `${filename}.${hash}`;
    }
    const ext = parts.pop();
    return `${parts.join('.')}.${hash.substring(0, 8)}.${ext}`;
  }
}
