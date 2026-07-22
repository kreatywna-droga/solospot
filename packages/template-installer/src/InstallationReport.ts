export interface InstallationReport {
  id: string;
  templateId: string;
  templateVersion: string;
  tenantId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  stepsCompleted: string[];
  stepsFailed: string[];
  installedComponents: string[];
  installedThemes: string[];
  installedAssets: string[];
  migrations: string[];
  warnings: string[];
  errors: string[];
  compatibilityIssues: string[];
}

export class InstallationReportBuilder {
  private id: string = '';
  private templateId: string = '';
  private templateVersion: string = '';
  private tenantId: string = '';
  private status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back' = 'pending';
  private startedAt: string = new Date().toISOString();
  private completedAt?: string;
  private durationMs?: number;
  private stepsCompleted: string[] = [];
  private stepsFailed: string[] = [];
  private installedComponents: string[] = [];
  private installedThemes: string[] = [];
  private installedAssets: string[] = [];
  private migrations: string[] = [];
  private warnings: string[] = [];
  private errors: string[] = [];
  private compatibilityIssues: string[] = [];

  withId(id: string): InstallationReportBuilder {
    this.id = id;
    return this;
  }

  withTemplate(templateId: string, templateVersion: string): InstallationReportBuilder {
    this.templateId = templateId;
    this.templateVersion = templateVersion;
    return this;
  }

  withTenant(tenantId: string): InstallationReportBuilder {
    this.tenantId = tenantId;
    return this;
  }

  setStatus(status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back'): InstallationReportBuilder {
    this.status = status;
    return this;
  }

  markStepCompleted(stepId: string, artifacts?: { components?: string[]; themes?: string[]; assets?: string[] }): InstallationReportBuilder {
    this.stepsCompleted.push(stepId);
    if (artifacts) {
      this.installedComponents.push(...(artifacts.components || []));
      this.installedThemes.push(...(artifacts.themes || []));
      this.installedAssets.push(...(artifacts.assets || []));
    }
    return this;
  }

  markStepFailed(stepId: string, error: string): InstallationReportBuilder {
    this.stepsFailed.push(stepId);
    this.errors.push(error);
    return this;
  }

  addWarning(warning: string): InstallationReportBuilder {
    this.warnings.push(warning);
    return this;
  }

  addCompatibilityIssue(issue: string): InstallationReportBuilder {
    this.compatibilityIssues.push(issue);
    return this;
  }

  addMigration(migrationId: string): InstallationReportBuilder {
    this.migrations.push(migrationId);
    return this;
  }

  complete(): InstallationReport {
    this.completedAt = new Date().toISOString();
    this.durationMs = new Date(this.completedAt).getTime() - new Date(this.startedAt).getTime();
    this.status = 'completed';

    return {
      id: this.id,
      templateId: this.templateId,
      templateVersion: this.templateVersion,
      tenantId: this.tenantId,
      status: this.status,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      durationMs: this.durationMs,
      stepsCompleted: this.stepsCompleted,
      stepsFailed: this.stepsFailed,
      installedComponents: this.installedComponents,
      installedThemes: this.installedThemes,
      installedAssets: this.installedAssets,
      migrations: this.migrations,
      warnings: this.warnings,
      errors: this.errors,
      compatibilityIssues: this.compatibilityIssues
    };
  }

  fail(): InstallationReport {
    this.completedAt = new Date().toISOString();
    this.durationMs = new Date(this.completedAt).getTime() - new Date(this.startedAt).getTime();
    this.status = 'failed';

    return {
      id: this.id,
      templateId: this.templateId,
      templateVersion: this.templateVersion,
      tenantId: this.tenantId,
      status: this.status,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      durationMs: this.durationMs,
      stepsCompleted: this.stepsCompleted,
      stepsFailed: this.stepsFailed,
      installedComponents: this.installedComponents,
      installedThemes: this.installedThemes,
      installedAssets: this.installedAssets,
      migrations: this.migrations,
      warnings: this.warnings,
      errors: this.errors,
      compatibilityIssues: this.compatibilityIssues
    };
  }
}