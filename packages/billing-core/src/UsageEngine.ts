import { UsageRecord } from './BillingDomain';

export class UsageEngine {
  private records: Map<string, UsageRecord[]> = new Map();

  recordUsage(organizationId: string, metric: UsageRecord['metric'], value: number): UsageRecord {
    const record: UsageRecord = {
      id: `usage-${Date.now()}`,
      organizationId,
      metric,
      value,
      recordedAt: new Date().toISOString()
    };

    const orgRecords = this.records.get(organizationId) || [];
    orgRecords.push(record);
    this.records.set(organizationId, orgRecords);

    return record;
  }

  getTotalUsage(organizationId: string, metric: UsageRecord['metric']): number {
    const orgRecords = this.records.get(organizationId) || [];
    return orgRecords
      .filter(r => r.metric === metric)
      .reduce((sum, r) => sum + r.value, 0);
  }

  getDailyUsage(organizationId: string, metric: UsageRecord['metric']): Record<string, number> {
    const orgRecords = this.records.get(organizationId) || [];
    const daily: Record<string, number> = {};

    for (const record of orgRecords.filter(r => r.metric === metric)) {
      const date = record.recordedAt.split('T')[0];
      daily[date] = (daily[date] || 0) + record.value;
    }

    return daily;
  }

  resetDailyUsage(organizationId: string, metric: UsageRecord['metric']): void {
    const orgRecords = this.records.get(organizationId) || [];
    const today = new Date().toISOString().split('T')[0];

    this.records.set(organizationId, orgRecords.filter(r => r.metric !== metric || !r.recordedAt.startsWith(today)));
  }
}