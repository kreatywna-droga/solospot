import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { getTenantThemeById } from '@/lib/tenant/TenantTheme';

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await resolveTenantSession();
  const theme = getTenantThemeById(session.tenantId ?? undefined);
  const { colors } = theme;

  const cssVars = {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary ?? '#d946ef',
    '--color-accent': colors.accent ?? '#f59e0b',
    '--color-background': colors.background ?? '#050508',
    '--color-surface': colors.surface ?? '#080a12',
    '--color-text': colors.text ?? '#e2e8f0',
  } as React.CSSProperties;

  return (
    <div
      data-tenant={session.tenantId || ''}
      data-authenticated={session.isAuthenticated ? 'true' : 'false'}
      data-theme={theme.slug}
      style={cssVars}
    >
      {children}
    </div>
  );
}
