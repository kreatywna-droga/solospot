export interface PublishArtifact {
  readonly path: string;
  readonly contentType: string;
  readonly content: string | Uint8Array;
  readonly size: number;
  readonly hash?: string;
  readonly metadata?: Record<string, unknown>;
}
