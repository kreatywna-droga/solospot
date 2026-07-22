export interface AuditEvent {
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}
