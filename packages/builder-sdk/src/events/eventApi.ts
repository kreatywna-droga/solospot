export type BuilderEventType =
  | 'document:changed'
  | 'selection:changed'
  | 'canvas:rendered'
  | 'inspector:property_changed'
  | 'plugin:loaded'
  | 'plugin:unloaded'
  | string;

export interface BuilderEventMetadata {
  timestamp: string;
  sourceId: string;
  isCancelled?: boolean;
  correlationId?: string;
}

export interface BuilderEvent<T = any> {
  type: BuilderEventType;
  payload: T;
  metadata: BuilderEventMetadata;
}

export interface BuilderEventListener<T = any> {
  (event: BuilderEvent<T>): void;
}

export interface EventSubscription {
  unsubscribe(): void;
}
