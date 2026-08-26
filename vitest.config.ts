import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    root: path.resolve(__dirname),
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@web-factor/design-tokens': path.resolve(__dirname, './packages/design-tokens/src'),
    },
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgS2V5IiwiaWF0IjoxNTE2MjM5MDIyfQ',
    },
  },
});
