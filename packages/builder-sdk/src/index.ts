// SDK Core
export { SDK_VERSION, MIN_COMPATIBLE_SDK_VERSION } from './core/sdkCore';
export type {
  SDKIdentifier,
  SDKMetadata,
  CapabilityDescriptor,
  ICapabilityRegistry,
} from './core/sdkCore';

// Plugin API
export type {
  Plugin,
  PluginManifest,
  PluginContext,
  PluginLifecycle,
  PluginCapabilities,
} from './plugin/pluginApi';

// Event API
export type {
  BuilderEventType,
  BuilderEventMetadata,
  BuilderEvent,
  BuilderEventListener,
  EventSubscription,
} from './events/eventApi';

// Extension API
export type {
  PropertyExtension,
  ComponentExtension,
  InspectorExtension,
  ToolbarExtension,
  CommandExtension,
} from './extensions/extensionApi';
