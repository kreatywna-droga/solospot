import { describe, it, expect } from 'vitest';
import { AuditLogger } from './AuditLogger';

describe('AuditLogger', () => {
  const logger = new AuditLogger();

  it('should log security events', () => {
    logger.critical('org-1', 'Login', { ip: '192.168.1.1', success: true });
    
    const logs = logger.query('org-1', 'Login');
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('Login');
  });

  it('should filter by organization', () => {
    logger.log({
      id: 'audit-2',
      organizationId: 'org-2',
      action: 'Publish',
      resource: 'store',
      details: {},
      timestamp: new Date().toISOString()
    });

    const org1Logs = logger.query('org-1');
    const org2Logs = logger.query('org-2');

    expect(org1Logs.length).toBe(1);
    expect(org2Logs.length).toBe(1);
  });
});