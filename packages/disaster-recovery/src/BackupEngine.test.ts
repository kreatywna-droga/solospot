import { describe, it, expect } from 'vitest';
import { BackupEngine } from './BackupEngine';

describe('BackupEngine', () => {
  const engine = new BackupEngine();

  it('should create backup', async () => {
    const backup = await engine.createBackup();
    expect(backup.status).toBe('complete');
    expect(backup.type).toBe('full');
  });

  it('should create tenant backup', async () => {
    const backup = await engine.createBackup('t-1');
    expect(backup.tenantId).toBe('t-1');
    expect(backup.type).toBe('tenant');
  });

  it('should list backups', async () => {
    await engine.createBackup('t-2');
    const all = engine.listBackups();
    const tenant = engine.listBackups('t-2');

    expect(all.length).toBeGreaterThan(0);
    expect(tenant.length).toBe(1);
  });
});