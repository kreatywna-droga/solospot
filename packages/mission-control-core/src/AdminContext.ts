export interface AdminContext {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'SUPPORT';
  permissions: string[];
  correlationId: string;
}
