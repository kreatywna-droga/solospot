import { SDKIdentifier } from '../core/sdkCore';

export interface PropertyExtension<T = any> {
  id: SDKIdentifier;
  propertyName: string;
  category: string;
  defaultValue: T;
  validate(value: T): boolean;
  toCSS(value: T): Record<string, string>;
}

export interface ComponentExtension {
  id: SDKIdentifier;
  componentType: string;
  category: 'layout' | 'typography' | 'media' | 'interactive' | string;
  displayName: string;
  defaultProps: Record<string, any>;
  supportedProperties: string[];
}

export interface InspectorExtension {
  id: SDKIdentifier;
  targetPropertyName: string;
  sectionTitle: string;
  priority: number;
}

export interface ToolbarExtension {
  id: SDKIdentifier;
  label: string;
  icon: string;
  position: 'left' | 'center' | 'right';
  priority: number;
  actionId: string;
}

export interface CommandExtension<TArgs = any, TResult = any> {
  id: SDKIdentifier;
  commandName: string;
  validate(args: TArgs): boolean;
  execute(args: TArgs): TResult;
}
