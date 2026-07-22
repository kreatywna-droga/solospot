import { RuntimeMode } from './RuntimeMode';
import { RuntimeResult } from './RuntimeResult';
import { RuntimeContext } from './RuntimeContext';
import { PipelineRequest } from './PipelineRequest';

export interface PipelineContext {
  readonly request: PipelineRequest;
  readonly runtimeContext: RuntimeContext;
  readonly mode: RuntimeMode;
  readonly storeConfig: Record<string, unknown>;
  readonly packages: Map<string, unknown>;
  readonly capabilities: Map<string, unknown>;
  readonly theme: unknown;
  readonly sections: unknown[];
  readonly metadata: Record<string, unknown>;
}