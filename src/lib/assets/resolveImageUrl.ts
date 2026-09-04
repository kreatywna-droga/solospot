/**
 * Resolves any image property value (string, object, AssetReference, or asset:// URI)
 * to a clean, usable image URL for CSS background or <img> src.
 * Prevents `url([object Object])` bugs in rendered HTML.
 */
export function resolveImageUrl(input: unknown): string {
  if (!input) return '';

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return '';
    // If it's already an absolute or relative URL
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:')
    ) {
      return trimmed;
    }
    // Handle asset://<id> protocol if used
    if (trimmed.startsWith('asset://')) {
      return trimmed;
    }
    return trimmed;
  }

  if (typeof input === 'object' && input !== null) {
    const obj = input as Record<string, unknown>;
    if (typeof obj.url === 'string' && obj.url) {
      return obj.url;
    }
    if (typeof obj.publicUrl === 'string' && obj.publicUrl) {
      return obj.publicUrl;
    }
    if (typeof obj.src === 'string' && obj.src) {
      return obj.src;
    }
    // If only ID exists, return formatted reference or fallback
    if (typeof obj.id === 'string' && obj.id) {
      return `asset://${obj.id}`;
    }
  }

  return '';
}
