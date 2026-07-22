export interface ThemeManifest {
  id: string;
  version: string;
  defaultSettings: Record<string, any>;
}

export class ThemeResolver {
  private readonly registry = new Map<string, ThemeManifest>();

  constructor() {}

  /**
   * Registers a theme manifest in the registry.
   */
  public register(theme: ThemeManifest): void {
    this.registry.set(theme.id, theme);
  }

  /**
   * Resets the registry for testing.
   */
  public clear(): void {
    this.registry.clear();
  }

  /**
   * Resolves and merges theme configuration.
   */
  public resolve(
    themeId: string,
    customSettings: Record<string, any> = {}
  ): { id: string; version: string; settings: Record<string, any> } {
    const manifest = this.registry.get(themeId);
    if (!manifest) {
      throw new Error(`Theme not found in registry: ${themeId}`);
    }

    return {
      id: manifest.id,
      version: manifest.version,
      settings: {
        ...manifest.defaultSettings,
        ...customSettings,
      },
    };
  }
}
