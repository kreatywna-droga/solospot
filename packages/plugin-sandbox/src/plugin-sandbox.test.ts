import { describe, it, expect } from 'vitest';
import {
  PermissionRequest,
  PermissionPolicy,
  PermissionValidator,
  SecurityReportGenerator,
  PluginSandboxCLI,
  SandboxContext,
} from './index';

describe('Plugin Sandbox & Security Model Unit Tests', () => {
  const req: PermissionRequest = {
    pluginId: 'plugin:custom-theme',
    reason: 'Apply custom CSS theme colors',
    requestedPermissions: [
      { id: 'document:read', name: 'Read Document', group: 'document', scope: 'read', riskLevel: 'low' },
      { id: 'network:write', name: 'Network Write', group: 'network', scope: 'write', riskLevel: 'high' },
      { id: 'document:write', name: 'Write Document', group: 'document', scope: 'write', riskLevel: 'medium' },
    ],
  };

  it('should validate permission requests and detect conflicts', () => {
    const valRes = PermissionValidator.validateRequest(req);
    expect(valRes.isValid).toBe(true);
    expect(valRes.conflicts.length).toBeGreaterThan(0);
    expect(valRes.conflicts[0].permA).toBe('network:write');
  });

  it('should validate permission requests against restrictive policies', () => {
    const policy: PermissionPolicy = {
      id: 'policy-read-only',
      name: 'Read Only Policy',
      allowedGroups: ['document'],
      deniedPermissions: ['network:write'],
      maxRiskLevel: 'low',
    };

    const valRes = PermissionValidator.validateRequest(req, policy);
    expect(valRes.isValid).toBe(false);
    expect(valRes.errors.some(e => e.includes('explicitly denied'))).toBe(true);
  });

  it('should format sandbox context contracts correctly', () => {
    const ctx: SandboxContext = {
      pluginId: 'plugin:test',
      environment: 'iframe',
      limits: { maxMemoryMb: 128, maxExecutionTimeMs: 5000, maxNetworkRequestsPerMin: 10, allowDOMAccess: false },
      capabilities: { allowFetch: false, allowLocalStorage: false, allowPostMessage: true, allowDOMMutation: false },
      activePermissions: ['document:read'],
      createdAt: new Date().toISOString(),
    };

    expect(ctx.environment).toBe('iframe');
    expect(ctx.limits.maxMemoryMb).toBe(128);
  });

  it('should generate security report Markdown & JSON', () => {
    const report = SecurityReportGenerator.generateReport(req);
    expect(report.overallRiskLevel).toBe('critical');

    const md = SecurityReportGenerator.toMarkdown(report);
    expect(md).toContain('# Plugin Sandbox Security Report');
    expect(md).toContain('`plugin:custom-theme`');

    const json = SecurityReportGenerator.toJSON(report);
    expect(json).toContain('"overallRiskLevel": "critical"');
  });

  it('should parse CLI arguments correctly', () => {
    const cliRes = PluginSandboxCLI.parseArgs(['validate', '--request=req.json']);
    expect(cliRes.command).toBe('validate');
    expect(cliRes.requestPath).toBe('req.json');

    const help = PluginSandboxCLI.getHelpText();
    expect(help).toContain('Usage: plugin-sandbox <command>');
  });
});
