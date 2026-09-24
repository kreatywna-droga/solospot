/**
 * Design Style Preview — Preview Generation for Design Styles
 *
 * Provides preview generation for design styles and style packs.
 */

export interface PreviewConfig {
  stylePackId: string;
  typography: {
    h1: string;
    h2: string;
    body: string;
    button: string;
    label: string;
  };
  colors: {
    background: string;
    text: string;
    accent: string;
    secondary: string;
  };
  buttons: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  cards: {
    title: string;
    description: string;
    image?: string;
  };
  background: {
    type: 'solid' | 'gradient' | 'pattern' | 'image';
    value: string;
  };
  spacing: {
    padding: string;
    gap: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

export interface StylePreview {
  id: string;
  stylePackId: string;
  name: string;
  description: string;
  config: PreviewConfig;
  rendered: string;
  createdAt: number;
}

export function generatePreview(stylePackId: string, stylePack: any): StylePreview {
  const config: PreviewConfig = {
    stylePackId,
    typography: {
      h1: 'The Quick Brown Fox',
      h2: 'Subheading Text',
      body: 'Sample body text for preview',
      button: 'Click Here',
      label: 'Label Text',
    },
    colors: {
      background: '#FFFFFF',
      text: '#1E293B',
      accent: '#3B82F6',
      secondary: '#64748B',
    },
    buttons: {
      primary: 'Primary Button',
      secondary: 'Secondary Button',
      tertiary: 'Tertiary Button',
    },
    cards: {
      title: 'Card Title',
      description: 'Card description text',
    },
    background: {
      type: 'solid',
      value: '#FFFFFF',
    },
    spacing: {
      padding: '24px',
      gap: '16px',
    },
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
    },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 2px 4px rgba(0,0,0,0.06)',
      lg: '0 4px 8px rgba(0,0,0,0.08)',
    },
  };

  return {
    id: `preview-${stylePackId}`,
    stylePackId,
    name: stylePack.name,
    description: stylePack.description,
    config,
    rendered: `Preview for ${stylePack.name}`,
    createdAt: Date.now(),
  };
}

export function generateFullPreview(stylePacks: any[]): StylePreview[] {
  return stylePacks.map((pack) => generatePreview(pack.id, pack));
}

export default {
  generatePreview,
  generateFullPreview,
};
