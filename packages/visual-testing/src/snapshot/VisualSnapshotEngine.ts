export interface ViewportSize {
  width: number;
  height: number;
}

export interface VisualSnapshotMetadata {
  version: string;
  timestamp: string;
  viewport: ViewportSize;
  themeName: string;
  devicePixelRatio: number;
  environment: string;
}

export interface VisualSnapshot {
  id: string;
  name: string;
  componentType: string;
  domStructureHash: string;
  cssPropertiesMap: Record<string, string>;
  metadata: VisualSnapshotMetadata;
}

export class VisualSnapshotEngine {
  public static readonly CURRENT_VERSION = '1.0.0';

  public static createSnapshot(
    name: string,
    componentType: string,
    domStructureHash: string,
    cssPropertiesMap: Record<string, string>,
    options?: Partial<VisualSnapshotMetadata>
  ): VisualSnapshot {
    return {
      id: `vsnap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      componentType,
      domStructureHash,
      cssPropertiesMap,
      metadata: {
        version: VisualSnapshotEngine.CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        viewport: options?.viewport || { width: 1280, height: 720 },
        themeName: options?.themeName || 'light',
        devicePixelRatio: options?.devicePixelRatio || 1,
        environment: options?.environment || 'test',
      },
    };
  }

  public static serialize(snapshot: VisualSnapshot): string {
    return JSON.stringify(snapshot, null, 2);
  }

  public static deserialize(jsonString: string): VisualSnapshot {
    const obj = JSON.parse(jsonString);
    if (!obj.id || !obj.domStructureHash || !obj.metadata) {
      throw new Error('Invalid VisualSnapshot JSON structure');
    }
    return obj;
  }

  public static validate(snapshot: VisualSnapshot): boolean {
    return Boolean(
      snapshot &&
      snapshot.id &&
      snapshot.name &&
      snapshot.domStructureHash &&
      typeof snapshot.cssPropertiesMap === 'object' &&
      snapshot.metadata &&
      snapshot.metadata.version
    );
  }
}
