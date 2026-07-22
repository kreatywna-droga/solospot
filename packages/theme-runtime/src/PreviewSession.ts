// PreviewSession.ts
// C6.3-F: Preview Pipeline — encapsulated preview state

export interface PreviewViewport {
  readonly width: number;
  readonly label: 'MOBILE' | 'TABLET' | 'DESKTOP';
}

export interface PreviewTheme {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly fontFamily: string;
  readonly backgroundColor: string;
  readonly borderRadius: string;
}

export interface PreviewDocument {
  readonly storeId: string;
  readonly tenantId: string;
  readonly storeName: string;
  readonly storeSlug: string;
  readonly publicationStatus: 'DRAFT' | 'PUBLISHED';
  readonly branding: {
    readonly primaryColor: string;
    readonly secondaryColor: string;
    readonly font: string;
    readonly logo?: string;
    readonly favicon?: string;
    readonly description?: string;
    readonly backgroundColor?: string;
    readonly borderRadius?: string;
  };
  readonly pages: ReadonlyArray<{
    readonly id: string;
    readonly slug: string;
    readonly name: string;
    readonly sections: ReadonlyArray<{
      readonly id: string;
      readonly type: string;
      readonly label: string;
      readonly props: Record<string, unknown>;
      readonly order: number;
      readonly visible: boolean;
    }>;
  }>;
  readonly locale: string;
  readonly currency: string;
}

export interface PreviewAssets {
  resolve(reference: { id: string; type: string }, options?: Record<string, unknown>): Promise<string>;
}

export interface PreviewSessionOptions {
  readonly document?: PreviewDocument;
  readonly viewport?: PreviewViewport;
  readonly locale?: string;
  readonly theme?: PreviewTheme;
  readonly assets?: PreviewAssets;
}

export class PreviewSession {
  readonly document: PreviewDocument;
  readonly viewport: PreviewViewport;
  readonly locale: string;
  readonly theme: PreviewTheme;
  readonly assets: PreviewAssets;

  constructor(options: PreviewSessionOptions) {
    this.document = options.document ?? {
      storeId: '',
      tenantId: '',
      storeName: '',
      storeSlug: '',
      publicationStatus: 'DRAFT',
      branding: {
        primaryColor: '#000000',
        secondaryColor: '#000000',
        font: 'system-ui',
      },
      pages: [],
      locale: 'pl_PL',
      currency: 'PLN',
    };
    this.viewport = options.viewport ?? { width: 1280, label: 'DESKTOP' };
    this.locale = options.locale ?? 'pl_PL';
    this.theme = options.theme ?? {
      primaryColor: '#8b5cf6',
      secondaryColor: '#d946ef',
      fontFamily: 'Inter',
      backgroundColor: '#050508',
      borderRadius: '4px',
    };
    this.assets = options.assets ?? {
      resolve: async () => '',
    };
  }

  withViewport(viewport: PreviewViewport): PreviewSession {
    return new PreviewSession({
      ...this,
      viewport,
    });
  }

  withTheme(theme: PreviewTheme): PreviewSession {
    return new PreviewSession({
      ...this,
      theme,
    });
  }

  withLocale(locale: string): PreviewSession {
    return new PreviewSession({
      ...this,
      locale,
    });
  }
}
