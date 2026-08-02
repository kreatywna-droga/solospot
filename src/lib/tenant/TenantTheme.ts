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

/**
 * Converts TenantThemeColors to a CSS Custom Properties object.
 * Use as style prop on a root element to override --color-* variables per tenant.
 *
 * @example
 * <div style={generateThemeCssVars(theme.colors)}>...</div>
 */
export function generateThemeCssVars(colors: TenantThemeColors): Record<string, string> {
  const vars: Record<string, string> = {
    '--color-primary': colors.primary,
  };
  if (colors.secondary)   vars['--color-secondary']   = colors.secondary;
  if (colors.accent)      vars['--color-accent']      = colors.accent;
  if (colors.background)  vars['--color-background']  = colors.background;
  if (colors.surface)     vars['--color-surface']     = colors.surface;
  if (colors.text)        vars['--color-text']        = colors.text;
  return vars;
}
