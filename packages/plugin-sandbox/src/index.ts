// Permission Model API
export type {
  PermissionScope,
  PermissionGroup,
  RiskLevel,
  Permission,
  PermissionPolicy,
  PermissionRequest,
  PermissionGrant,
} from './permissions/PermissionModel';

// Sandbox Contracts API
export type {
  SandboxEnvironment,
  SandboxLimits,
  SandboxCapabilities,
  SandboxContext,
  SandboxResult,
} from './sandbox/SandboxContracts';

// Permission Validator API
export { PermissionValidator } from './validator/PermissionValidator';
export type {
  PermissionConflict,
  PermissionValidationResult,
} from './validator/PermissionValidator';

// Security Report Generator API
export { SecurityReportGenerator } from './report/SecurityReportGenerator';
export type { SecurityReportData } from './report/SecurityReportGenerator';

// CLI API
export { PluginSandboxCLI } from './cli/PluginSandboxCLI';
export type { SandboxCLICommand, SandboxCLIParseResult } from './cli/PluginSandboxCLI';
