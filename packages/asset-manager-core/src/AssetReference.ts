// AssetReference.ts
import { AssetType } from './AssetTypes';

/**
 * AssetReference is a lightweight reference to an asset that
 * stores only the essential information needed to identify
 * and later resolve the actual asset URL.
 * 
 * Key benefit: By storing references by ID/type instead of
 * direct URLs, we can change CDN providers, versioning strategies,
 * or storage mechanisms without breaking existing references.
 */
export class AssetReference {
  constructor(
    public readonly id: string,
    public readonly type: AssetType
  ) {}

  /**
   * Create a reference from an Asset object
   */
  static fromAsset(asset: { id: string; type: AssetType }): AssetReference {
    return new AssetReference(asset.id, asset.type);
  }

  /**
   * Check if this reference matches another by ID and type
   */
  equals(other: AssetReference): boolean {
    return this.id === other.id && this.type === other.type;
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): { id: string; type: AssetType } {
    return { id: this.id, type: this.type };
  }

  /**
   * Create AssetReference from JSON/plain object
   */
  static fromJSON(data: { id: string; type: AssetType }): AssetReference {
    return new AssetReference(data.id, data.type);
  }
}