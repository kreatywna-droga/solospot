import { PermissionRequest, RiskLevel } from '../permissions/PermissionModel';
import { PermissionValidator, PermissionValidationResult } from '../validator/PermissionValidator';

export interface SecurityReportData {
  timestamp: string;
  pluginId: string;
  overallRiskLevel: RiskLevel;
  validation: PermissionValidationResult;
  recommendations: string[];
}

export class SecurityReportGenerator {
  public static generateReport(request: PermissionRequest): SecurityReportData {
    const validation = PermissionValidator.validateRequest(request);

    let maxScore = 1;
    for (const p of request.requestedPermissions || []) {
      const score = PermissionValidator.RISK_HIERARCHY[p.riskLevel] || 1;
      if (score > maxScore) maxScore = score;
    }

    let overallRiskLevel: RiskLevel = 'low';
    if (maxScore === 4 || validation.conflicts.length > 0) overallRiskLevel = 'critical';
    else if (maxScore === 3) overallRiskLevel = 'high';
    else if (maxScore === 2) overallRiskLevel = 'medium';

    const recommendations: string[] = [];
    if (validation.conflicts.length > 0) {
      recommendations.push('Resolve security group conflicts (e.g. separation of network write and document write).');
    }
    if (overallRiskLevel === 'critical' || overallRiskLevel === 'high') {
      recommendations.push('Require explicit administrator approval for high-risk permissions.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Permission request conforms to standard sandbox policy.');
    }

    return {
      timestamp: new Date().toISOString(),
      pluginId: request.pluginId,
      overallRiskLevel,
      validation,
      recommendations,
    };
  }

  public static toMarkdown(data: SecurityReportData): string {
    const lines: string[] = [];

    lines.push('# Plugin Sandbox Security Report');
    lines.push('');
    lines.push(`- **Plugin ID:** \`${data.pluginId}\``);
    lines.push(`- **Timestamp:** \`${data.timestamp}\``);
    lines.push(`- **Overall Risk Level:** **${data.overallRiskLevel.toUpperCase()}**`);
    lines.push(`- **Status:** ${data.validation.isValid ? 'VALIDATED ✅' : 'INVALID ❌'}`);
    lines.push('');

    if (data.validation.conflicts.length > 0) {
      lines.push('## Security Conflicts Detected');
      lines.push('');
      for (const c of data.validation.conflicts) {
        lines.push(`- ⚠️ **[${c.permA} ↔ ${c.permB}]**: ${c.reason}`);
      }
      lines.push('');
    }

    lines.push('## Recommendations');
    lines.push('');
    for (const r of data.recommendations) {
      lines.push(`- 💡 ${r}`);
    }
    lines.push('');

    return lines.join('\n');
  }

  public static toJSON(data: SecurityReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
