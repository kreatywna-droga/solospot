/**
 * Namespace definitions and types for logging categories.
 */
export type KnownNamespace =
  | 'builder:shell'
  | 'builder:core'
  | 'builder:canvas'
  | 'builder:inspector'
  | 'builder:registry'
  | 'runtime'
  | 'devtools'
  | string;

export class Namespace {
  constructor(public readonly name: KnownNamespace) {}

  public toString(): string {
    return `[${this.name}]`;
  }
}
