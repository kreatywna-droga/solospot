export type PermissionScope = 'read' | 'write' | 'execute' | 'network' | 'storage';
export type PermissionGroup = 'document' | 'inspector' | 'registry' | 'network' | 'system';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Permission {
  id: string; // e.g. "document:write"
  name: string;
  group: PermissionGroup;
  scope: PermissionScope;
  riskLevel: RiskLevel;
  description?: string;
}

export interface PermissionPolicy {
  id: string;
  name: string;
  allowedGroups: PermissionGroup[];
  deniedPermissions: string[]; // permission IDs explicitly forbidden
  maxRiskLevel: RiskLevel;
}

export interface PermissionRequest {
  pluginId: string;
  requestedPermissions: Permission[];
  reason: string;
}

export interface PermissionGrant {
  pluginId: string;
  grantedPermissions: string[]; // permission IDs
  grantedAt: string;
  grantedBy: string;
  expiresAt?: string;
}
