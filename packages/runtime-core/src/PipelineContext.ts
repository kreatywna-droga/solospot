import { RuntimeMode } from './RuntimeMode';
import { RuntimeResult } from './RuntimeResult';
import { RuntimeContext } from './RuntimeContext';
import { PipelineRequest } from './PipelineRequest';

export interface PipelineContext {
  readonly request: PipelineRequest;
  /**
   * Mutable — the runtime-composition stage replaces this with a context
   * built from the composed StoreRuntimeSnapshot. Consumers must re-read
   * this field after that stage runs.
   */
  runtimeContext: RuntimeContext;
  readonly mode: RuntimeMode;
  readonly storeConfig: Record<string, unknown>;
  readonly packages: Map<string, unknown>;
  readonly capabilities: Map<string, unknown>;
  readonly theme: unknown;
  readonly sections: unknown[];
  readonly metadata: Record<string, unknown>;
}
