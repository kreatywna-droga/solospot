export interface DeploymentTarget {
  readonly type: 'local' | 'static-export' | 's3' | 'r2' | 'vercel' | 'netlify' | string;
  readonly destination: string;
  readonly credentials?: Record<string, string>;
  readonly options?: Record<string, unknown>;
}
