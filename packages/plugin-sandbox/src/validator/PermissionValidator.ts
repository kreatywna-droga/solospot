import { Permission, PermissionPolicy, PermissionRequest, PermissionGroup, RiskLevel } from '../permissions/PermissionModel';

export interface PermissionConflict {
  permA: string;
  permB: string;
  reason: string;
}

export interface PermissionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: PermissionConflict[];
}

export class PermissionValidator {
  public static readonly KNOWN_GROUPS: PermissionGroup[] = [
    'document',
    'inspector',
    'registry',
    'network',
    'system',
  ];

  public static readonly RISK_HIERARCHY: Record<RiskLevel, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  public static validateRequest(request: PermissionRequest, policy?: PermissionPolicy): PermissionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: PermissionConflict[] = [];

    if (!request.pluginId) {
      errors.push('Permission request must include a pluginId.');
    }

    if (!request.requestedPermissions || request.requestedPermissions.length === 0) {
      warnings.push('Permission request contains 0 requested permissions.');
    }

    const seenIds = new Set<string>();

    for (const perm of request.requestedPermissions || []) {
      if (!perm.id || !perm.group || !perm.scope) {
        errors.push(`Invalid permission object format: ${JSON.stringify(perm)}`);
        continue;
      }

      if (!PermissionValidator.KNOWN_GROUPS.includes(perm.group)) {
        warnings.push(`Unknown permission group: '${perm.group}' in permission '${perm.id}'.`);
      }

      if (seenIds.has(perm.id)) {
        warnings.push(`Duplicate permission requested: '${perm.id}'.`);
      } else {
        seenIds.add(perm.id);
      }

      // Check against policy if provided
      if (policy) {
        if (policy.deniedPermissions.includes(perm.id)) {
          errors.push(`Permission '${perm.id}' is explicitly denied by policy '${policy.name}'.`);
        }
        if (!policy.allowedGroups.includes(perm.group)) {
          errors.push(`Permission group '${perm.group}' is not allowed by policy '${policy.name}'.`);
        }
        const permRiskScore = PermissionValidator.RISK_HIERARCHY[perm.riskLevel] || 1;
        const maxPolicyRiskScore = PermissionValidator.RISK_HIERARCHY[policy.maxRiskLevel] || 4;
        if (permRiskScore > maxPolicyRiskScore) {
          errors.push(`Permission '${perm.id}' risk level '${perm.riskLevel}' exceeds policy max '${policy.maxRiskLevel}'.`);
        }
      }
    }

    // Conflict detection
    const groupConflicts = PermissionValidator.detectGroupConflicts(request.requestedPermissions || []);
    conflicts.push(...groupConflicts);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      conflicts,
    };
  }

  public static detectGroupConflicts(permissions: Permission[]): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];
    const hasNetworkWrite = permissions.some(p => p.group === 'network' && (p.scope === 'write' || p.scope === 'execute'));
    const hasDocumentWrite = permissions.some(p => p.group === 'document' && p.scope === 'write');

    if (hasNetworkWrite && hasDocumentWrite) {
      conflicts.push({
        permA: 'network:write',
        permB: 'document:write',
        reason: 'Combining network write with document write increases data exfiltration risk.',
      });
    }

    return conflicts;
  }
}
