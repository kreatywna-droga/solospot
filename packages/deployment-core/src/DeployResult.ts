export interface DeployResult {
  readonly success: boolean;
  readonly url?: string;
  readonly deployedArtifactsCount: number;
  readonly errors: ReadonlyArray<string>;
  readonly durationMs: number;
  readonly metadata?: Record<string, unknown>;
}
