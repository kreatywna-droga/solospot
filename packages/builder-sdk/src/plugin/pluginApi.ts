import { SDKIdentifier } from '../core/sdkCore';

export interface PluginCapabilities {
  canModifyDocument?: boolean;
  canRegisterProperties?: boolean;
  canRegisterComponents?: boolean;
  canAccessNetwork?: boolean;
  customCapabilities?: string[];
}

export interface PluginManifest {
  id: SDKIdentifier;
  name: string;
  version: string;
  author: string;
  description: string;
  requiredSDKVersion: string;
  capabilities: PluginCapabilities;
  homepage?: string;
}

export interface PluginContext {
  pluginId: SDKIdentifier;
  sdkVersion: string;
  logger: {
    info(msg: string, ...data: any[]): void;
    warn(msg: string, ...data: any[]): void;
    error(msg: string, ...data: any[]): void;
  };
  metadata: Record<string, any>;
}

export interface PluginLifecycle {
  onLoad?(context: PluginContext): Promise<void> | void;
  onEnable?(context: PluginContext): Promise<void> | void;
  onDisable?(context: PluginContext): Promise<void> | void;
  onUnload?(context: PluginContext): Promise<void> | void;
}

export interface Plugin extends PluginLifecycle {
  manifest: PluginManifest;
}
