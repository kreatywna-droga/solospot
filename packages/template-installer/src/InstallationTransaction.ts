import { InstallationPlan, InstallationStep } from './InstallationPlan';
import { InstallationReport } from './InstallationReport';

export enum TransactionStatus {
  STARTED = 'STARTED',
  COMMITTED = 'COMMITTED',
  ROLLED_BACK = 'ROLLED_BACK',
  FAILED = 'FAILED'
}

export interface TransactionContext {
  tenantId: string;
  templateId: string;
  templateVersion: string;
  artifacts: {
    components: string[];
    themes: string[];
    assets: string[];
  };
  metadata: Record<string, unknown>;
}

export interface TransactionEvent {
  type: 'TRANSACTION_STARTED' | 'STEP_STARTED' | 'STEP_COMPLETED' | 'STEP_ROLLED_BACK' | 'TRANSACTION_COMPLETED' | 'TRANSACTION_FAILED';
  stepId?: string;
  stepName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export class InstallationTransaction {
  private status: TransactionStatus = TransactionStatus.STARTED;
  private context: TransactionContext | null = null;
  private executedSteps: string[] = [];
  private rolledBackSteps: string[] = [];
  private errors: string[] = [];
  private warnings: string[] = [];
  private startTime: string = new Date().toISOString();
  private endTime?: string;
  private eventListeners: ((event: TransactionEvent) => void)[] = [];

  begin(plan: InstallationPlan): void {
    this.context = {
      tenantId: plan.tenantId,
      templateId: plan.templateId,
      templateVersion: plan.templateVersion,
      artifacts: {
        components: [],
        themes: [],
        assets: []
      },
      metadata: {}
    };
    this.status = TransactionStatus.STARTED;
    this.emit({
      type: 'TRANSACTION_STARTED',
      timestamp: new Date().toISOString(),
      metadata: { templateId: plan.templateId, tenantId: plan.tenantId }
    });
  }

  async executeStep(step: InstallationStep): Promise<boolean> {
    if (!this.context) {
      throw new Error('Transaction not started');
    }

    this.emit({
      type: 'STEP_STARTED',
      stepId: step.id,
      stepName: step.name,
      timestamp: new Date().toISOString()
    });

    try {
      await this.runStep(step);
      this.executedSteps.push(step.id);
      this.emit({
        type: 'STEP_COMPLETED',
        stepId: step.id,
        stepName: step.name,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      this.errors.push(error instanceof Error ? error.message : String(error));
      this.status = TransactionStatus.FAILED;
      this.emit({
        type: 'TRANSACTION_FAILED',
        stepId: step.id,
        timestamp: new Date().toISOString(),
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });
      return false;
    }
  }

  async rollback(): Promise<void> {
    if (!this.context) {
      throw new Error('Transaction not started');
    }

    this.status = TransactionStatus.ROLLED_BACK;
    const reversedSteps = [...this.executedSteps].reverse();

    for (const stepId of reversedSteps) {
      try {
        await this.rollbackStep(stepId);
        this.rolledBackSteps.push(stepId);
        this.emit({
          type: 'STEP_ROLLED_BACK',
          stepId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        this.errors.push(`Rollback failed for ${stepId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.endTime = new Date().toISOString();
    this.emit({
      type: 'TRANSACTION_COMPLETED',
      timestamp: this.endTime,
      metadata: { status: 'ROLLED_BACK', rolledBackSteps: this.rolledBackSteps.length }
    });
  }

  commit(): void {
    if (this.status !== TransactionStatus.STARTED) {
      throw new Error('Transaction is not in STARTED state');
    }

    this.status = TransactionStatus.COMMITTED;
    this.endTime = new Date().toISOString();
    this.emit({
      type: 'TRANSACTION_COMPLETED',
      timestamp: this.endTime,
      metadata: { status: 'COMMITTED', executedSteps: this.executedSteps.length }
    });
  }

  abort(): void {
    this.status = TransactionStatus.FAILED;
    this.endTime = new Date().toISOString();
    this.emit({
      type: 'TRANSACTION_FAILED',
      timestamp: this.endTime,
      metadata: { status: 'ABORTED' }
    });
  }

  addEventListener(listener: (event: TransactionEvent) => void): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (event: TransactionEvent) => void): void {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }

  private emit(event: TransactionEvent): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  protected async runStep(step: InstallationStep): Promise<void> {
    switch (step.type) {
      case 'theme':
        await this.installTheme(step.payload as Record<string, unknown>);
        break;
      case 'components':
        await this.installComponents(step.payload as Record<string, unknown>);
        break;
      case 'assets':
        await this.installAssets(step.payload as Record<string, unknown>);
        break;
      case 'pages':
        await this.installPages(step.payload as Record<string, unknown>);
        break;
      case 'commerce':
        await this.installCommerce(step.payload as Record<string, unknown>);
        break;
      case 'configuration':
        await this.applyConfiguration(step.payload as Record<string, unknown>);
        break;
    }
  }

  protected async rollbackStep(stepId: string): Promise<void> {
    // Concrete implementations should override this for actual rollback logic
  }

  protected async installTheme(themeData: Record<string, unknown>): Promise<void> {}
  protected async installComponents(componentData: Record<string, unknown>): Promise<void> {}
  protected async installAssets(assetData: Record<string, unknown>): Promise<void> {}
  protected async installPages(pageData: Record<string, unknown>): Promise<void> {}
  protected async installCommerce(commerceData: Record<string, unknown>): Promise<void> {}
  protected async applyConfiguration(configData: Record<string, unknown>): Promise<void> {}

  getReport(): InstallationReport {
    const durationMs = this.endTime 
      ? new Date(this.endTime).getTime() - new Date(this.startTime).getTime()
      : new Date().getTime() - new Date(this.startTime).getTime();

    return {
      id: `tx-${this.context?.tenantId}-${Date.now()}`,
      templateId: this.context?.templateId || '',
      templateVersion: this.context?.templateVersion || '',
      tenantId: this.context?.tenantId || '',
      status: this.mapStatus(),
      startedAt: this.startTime,
      completedAt: this.endTime,
      durationMs,
      stepsCompleted: this.executedSteps,
      stepsFailed: this.errors.length > 0 ? this.executedSteps.slice(-1) : [],
      installedComponents: this.context?.artifacts.components || [],
      installedThemes: this.context?.artifacts.themes || [],
      installedAssets: this.context?.artifacts.assets || [],
      migrations: [],
      warnings: this.warnings,
      errors: this.errors,
      compatibilityIssues: []
    };
  }

  private mapStatus(): 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back' {
    switch (this.status) {
      case TransactionStatus.STARTED: return 'pending';
      case TransactionStatus.COMMITTED: return 'completed';
      case TransactionStatus.ROLLED_BACK: return 'rolled-back';
      case TransactionStatus.FAILED: return 'failed';
      default: return 'pending';
    }
  }
}