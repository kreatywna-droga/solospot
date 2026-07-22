export interface Backup {
  id: string;
  tenantId?: string;
  timestamp: string;
  type: 'full' | 'incremental' | 'tenant';
  size: number;
  location: string;
  status: 'pending' | 'complete' | 'failed';
}

export interface RecoveryPlan {
  id: string;
  name: string;
  steps: RecoveryStep[];
  enabled: boolean;
}

export interface RecoveryStep {
  order: number;
  type: 'backup' | 'restore' | 'rollback' | 'verify';
  target: string;
  config: Record<string, unknown>;
}