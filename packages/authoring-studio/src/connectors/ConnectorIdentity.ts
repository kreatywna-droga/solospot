/**
 * ConnectorIdentity.ts — Sprint S8 Authentication Models (ETAP 4)
 *
 * Identity models for connector authentication. No OAuth implementation.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution, NO network communication.
 */

export interface ConnectorIdentity {
  readonly identityId: string;
  readonly connectorId: string;
  readonly externalUserId?: string;
  readonly displayName?: string;
  readonly email?: string;
  readonly avatarUrl?: string;
  readonly roles?: ReadonlyArray<string>;
  readonly permissions?: ReadonlyArray<string>;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly createdAt: number;
}

export interface ConnectorIdentityState {
  readonly identities: ReadonlyArray<ConnectorIdentity>;
}

export function createConnectorIdentityState(
  identities: ReadonlyArray<ConnectorIdentity> = []
): ConnectorIdentityState {
  return {
    identities: [...identities],
  };
}

export function createConnectorIdentity(
  connectorId: string,
  externalUserId?: string,
  displayName?: string,
  email?: string,
  avatarUrl?: string,
  roles?: ReadonlyArray<string>,
  permissions?: ReadonlyArray<string>,
  metadata?: Readonly<Record<string, unknown>>
): ConnectorIdentity {
  return {
    identityId: `identity-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    connectorId,
    externalUserId,
    displayName,
    email,
    avatarUrl,
    roles: roles ? [...roles] : undefined,
    permissions: permissions ? [...permissions] : undefined,
    metadata: metadata ? { ...metadata } : undefined,
    createdAt: Date.now(),
  };
}

export function getConnectorIdentity(
  state: ConnectorIdentityState,
  connectorId: string
): ConnectorIdentity | undefined {
  return state.identities.find((i) => i.connectorId === connectorId);
}

export function upsertConnectorIdentity(
  state: ConnectorIdentityState,
  identity: ConnectorIdentity
): ConnectorIdentityState {
  const filtered = state.identities.filter(
    (i) => i.connectorId !== identity.connectorId
  );
  return {
    identities: [...filtered, identity],
  };
}

export function removeConnectorIdentity(
  state: ConnectorIdentityState,
  connectorId: string
): ConnectorIdentityState {
  return {
    identities: state.identities.filter((i) => i.connectorId !== connectorId),
  };
}

export function hasIdentityRole(
  identity: ConnectorIdentity,
  role: string
): boolean {
  return identity.roles?.includes(role) ?? false;
}

export function hasIdentityPermission(
  identity: ConnectorIdentity,
  permission: string
): boolean {
  return identity.permissions?.includes(permission) ?? false;
}
