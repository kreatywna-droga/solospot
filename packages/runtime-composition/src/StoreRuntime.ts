import { RuntimeSnapshot } from './RuntimeSnapshot';

export type StoreLifecycleState = 'CREATED' | 'LOADING' | 'READY' | 'ACTIVE' | 'DISPOSED';

export interface RuntimeModule {
  readonly id: string;
  readonly manifest: any;
  initialize(context: RuntimeSnapshot): Promise<void>;
  executeAction(actionName: string, payload: any): Promise<any>;
  dispose(): Promise<void>;
}

export interface StoreRenderer {
  renderView(viewName: string, props: Record<string, any>): Promise<string>;
}

export interface StoreRuntime {
  readonly tenantId: string;
  readonly runtimeSnapshot: RuntimeSnapshot;
  readonly modules: Map<string, RuntimeModule>;
  readonly renderer: StoreRenderer;
  readonly lifecycle: StoreLifecycleState;
}

export class IllegalLifecycleStateException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalLifecycleStateException';
  }
}
