/**
 * MediaImportEngine.ts — Sprint S15 Media Import Engine (ETAP 1)
 *
 * Implements media import workflows for images, SVGs, fonts, audio, and video files.
 * Assigns stable AssetIDs, handles drag & drop input payloads, batch imports,
 * and classifies media MIME types.
 *
 * Headless domain model — zero direct DOM rendering.
 */

export type MediaKind = 'image' | 'svg' | 'font' | 'audio' | 'video' | 'unknown';

export interface RawMediaFileDescriptor {
  readonly fileName: string;
  readonly mimeType: string;
  readonly fileSizeBytes: number;
  readonly contentBuffer?: ArrayBuffer | string;
  readonly sourceUri?: string;
  readonly lastModified?: number;
}

export interface ImportedMediaAsset {
  readonly assetId: string;
  readonly fileName: string;
  readonly mediaKind: MediaKind;
  readonly mimeType: string;
  readonly fileSizeBytes: number;
  readonly contentBuffer?: ArrayBuffer | string;
  readonly sourceUri?: string;
  readonly importedAt: number;
}

export class MediaImportEngine {
  /**
   * Generates a stable, prefix-formatted Asset ID for media.
   */
  public static generateAssetId(kind: MediaKind, fileName: string): string {
    const cleanName = fileName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const hash = Math.abs(this.hashCode(`${fileName}_${Date.now()}_${Math.random()}`)).toString(36);
    return `asset_${kind}_${cleanName}_${hash}`;
  }

  /**
   * Classifies MediaKind based on file extension or MIME type.
   */
  public static detectMediaKind(fileName: string, mimeType: string): MediaKind {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (mimeType.includes('image/svg+xml') || ext === 'svg') return 'svg';
    if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image';
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'aac', 'ogg', 'm4a'].includes(ext)) return 'audio';
    if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
    if (mimeType.includes('font') || ['woff2', 'woff', 'ttf', 'otf'].includes(ext)) return 'font';

    return 'unknown';
  }

  /**
   * Processes a single raw media file import.
   */
  public static importFile(raw: RawMediaFileDescriptor): ImportedMediaAsset {
    const kind = this.detectMediaKind(raw.fileName, raw.mimeType);
    const assetId = this.generateAssetId(kind, raw.fileName);

    return {
      assetId,
      fileName: raw.fileName,
      mediaKind: kind,
      mimeType: raw.mimeType || this.defaultMimeTypeForKind(kind),
      fileSizeBytes: raw.fileSizeBytes,
      contentBuffer: raw.contentBuffer,
      sourceUri: raw.sourceUri,
      importedAt: Date.now(),
    };
  }

  /**
   * Processes a batch array of raw media files.
   */
  public static importBatch(rawFiles: readonly RawMediaFileDescriptor[]): ImportedMediaAsset[] {
    return rawFiles.map((file) => this.importFile(file));
  }

  /**
   * Helper to resolve default MIME type for media kind.
   */
  public static defaultMimeTypeForKind(kind: MediaKind): string {
    switch (kind) {
      case 'image':
        return 'image/png';
      case 'svg':
        return 'image/svg+xml';
      case 'font':
        return 'font/woff2';
      case 'audio':
        return 'audio/mpeg';
      case 'video':
        return 'video/mp4';
      default:
        return 'application/octet-stream';
    }
  }

  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash;
  }
}
