/**
 * box-shadow parse/build — pure helpers shared by ShadowEditor (ONE system).
 */

export interface BoxShadowValue {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  enabled: boolean;
}

export function parseBoxShadow(raw?: string): BoxShadowValue {
  if (!raw || raw === 'none') {
    return { x: 0, y: 4, blur: 16, spread: 0, color: '#000000', opacity: 0.25, enabled: false };
  }
  const m = raw.match(
    /^-?(?:inset\s+)?(-?\d+(?:\.\d+)?)(?:px)?\s+(-?\d+(?:\.\d+)?)(?:px)?\s+(-?\d+(?:\.\d+)?)(?:px)?(?:\s+(-?\d+(?:\.\d+)?)(?:px)?)?\s*(.*)$/,
  );
  if (!m) {
    return { x: 0, y: 4, blur: 16, spread: 0, color: '#000000', opacity: 0.25, enabled: true };
  }
  const x = parseFloat(m[1]) || 0;
  const y = parseFloat(m[2]) || 0;
  const blur = parseFloat(m[3]) || 0;
  const spread = m[4] ? parseFloat(m[4]) || 0 : 0;
  const colorStr = (m[5] || '#000000').trim();

  let color = '#000000';
  let opacity = 0.25;

  const rgbaMatch = colorStr.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i);
  if (rgbaMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbaMatch[1], 10))).toString(16).padStart(2, '0');
    const g = Math.min(255, Math.max(0, parseInt(rgbaMatch[2], 10))).toString(16).padStart(2, '0');
    const b = Math.min(255, Math.max(0, parseInt(rgbaMatch[3], 10))).toString(16).padStart(2, '0');
    color = `#${r}${g}${b}`;
    opacity = parseFloat(rgbaMatch[4]);
  } else {
    const rgbMatch = colorStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
      const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10))).toString(16).padStart(2, '0');
      const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10))).toString(16).padStart(2, '0');
      const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10))).toString(16).padStart(2, '0');
      color = `#${r}${g}${b}`;
      opacity = 1;
    } else {
      const hexMatch = colorStr.match(/#([0-9a-fA-F]{3,6})/);
      if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) {
          hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
        }
        color = `#${hex}`;
        opacity = 1;
      }
    }
  }

  return { x, y, blur, spread, color, opacity, enabled: true };
}

export function buildBoxShadow(s: BoxShadowValue): string {
  if (!s.enabled) return 'none';
  const safe = s.color.startsWith('#') && s.color.length >= 7 ? s.color : '#000000';
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  return `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px rgba(${r},${g},${b},${s.opacity})`;
}
