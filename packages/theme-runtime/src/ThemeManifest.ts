import { z } from 'zod';

export const DesignTokensSchema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string(),
  backgroundColor: z.string(),
  fontFamily: z.string(),
  borderRadius: z.string(),
});
export type DesignTokens = z.infer<typeof DesignTokensSchema>;

export const ThemeManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  author: z.string().min(1),
  tokens: DesignTokensSchema,
  layouts: z.array(z.string()),
  components: z.record(
    z.string(),
    z.object({
      name: z.string().min(1),
      type: z.enum(['layout', 'widget', 'atom']),
    })
  ),
});
export type ThemeManifest = z.infer<typeof ThemeManifestSchema>;
