export interface TenantThemeColors {
  primary: string;
  secondary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
}

export interface TenantTheme {
  tenantId: string;
  slug: string;
  name: string;
  logo?: string;
  favicon?: string;
  colors: TenantThemeColors;
  font?: string;
}

const TENANT_THEMES: Record<string, TenantTheme> = {
  'fashion-demo': {
    tenantId: 'demo-fashion',
    slug: 'fashion-demo',
    name: 'Fashion Demo Store',
    logo: '/logos/fashion-demo.svg',
    colors: {
      primary: '#7c3aed',
      secondary: '#ec4899',
      accent: '#f59e0b',
      background: '#0a0a0e',
      surface: '#111118',
      text: '#f1f5f9',
    },
  },
  'beauty-demo': {
    tenantId: 'demo-beauty',
    slug: 'beauty-demo',
    name: 'Beauty Demo Store',
    colors: {
      primary: '#db2777',
      secondary: '#f472b6',
      accent: '#a855f7',
      background: '#0a0a0e',
      surface: '#111118',
      text: '#f1f5f9',
    },
  },
};

const DEFAULT_THEME: TenantTheme = {
  tenantId: 'default',
  slug: 'default',
  name: 'SoloSpot',
  colors: {
    primary: '#8b5cf6',
    secondary: '#d946ef',
    accent: '#f59e0b',
    background: '#050508',
    surface: '#080a12',
    text: '#e2e8f0',
  },
};

export function getTenantTheme(slug?: string): TenantTheme {
  if (slug && TENANT_THEMES[slug]) {
    return TENANT_THEMES[slug];
  }
  return DEFAULT_THEME;
}

export function getTenantThemeById(tenantId?: string): TenantTheme {
  if (tenantId) {
    const theme = Object.values(TENANT_THEMES).find(t => t.tenantId === tenantId);
    if (theme) return theme;
  }
  return DEFAULT_THEME;
}
