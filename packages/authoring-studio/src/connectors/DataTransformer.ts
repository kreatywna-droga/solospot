/**
 * DataTransformer.ts — Sprint S8 Data Transformation (ETAP 5)
 *
 * Data transformation interfaces and pipeline utilities for connector payloads.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export interface TransformationRule {
  readonly ruleId: string;
  readonly sourcePath: string;
  readonly targetPath: string;
  readonly transformFn?: (value: unknown) => unknown;
}

export interface DataTransformerConfig {
  readonly transformerId: string;
  readonly rules: ReadonlyArray<TransformationRule>;
}

export function createTransformerConfig(
  transformerId: string,
  rules: ReadonlyArray<TransformationRule> = []
): DataTransformerConfig {
  return {
    transformerId,
    rules: [...rules],
  };
}

export function applyTransformation(
  config: DataTransformerConfig,
  sourceData: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const rule of config.rules) {
    const rawValue = sourceData[rule.sourcePath];
    if (rawValue !== undefined) {
      const finalValue = rule.transformFn ? rule.transformFn(rawValue) : rawValue;
      result[rule.targetPath] = finalValue;
    }
  }

  return result;
}
