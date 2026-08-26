/**
 * ConnectorCredentials.ts — Sprint S8 Authentication Models (ETAP 4)
 *
 * Credential models for connector authentication. No OAuth implementation.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution, NO network communication.
 */

export type ConnectorCredentialType =
    | 'api_key'
    | 'bearer_token'
    | 'client_credentials'
    | 'basic_auth'
    | 'custom';

export interface ConnectorCredentials {
    readonly connectorId: string;
    readonly credentialType: ConnectorCredentialType;
    readonly apiKey?: string;
    readonly bearerToken?: string;
    readonly clientId?: string;
    readonly clientSecret?: string;
    readonly username?: string;
    readonly password?: string;
    readonly customFields?: Readonly<Record<string, string>>;
    readonly createdAt: number;
    readonly expiresAt?: number;
}

export interface ConnectorCredentialsState {
    readonly credentials: ReadonlyArray<ConnectorCredentials>;
}

export function createConnectorCredentialsState(
    credentials: ReadonlyArray<ConnectorCredentials> = []
): ConnectorCredentialsState {
    return {
        credentials: [...credentials],
    };
}

export function createConnectorCredentials(
    connectorId: string,
    credentialType: ConnectorCredentialType,
    fields: Partial<
        Pick<
            ConnectorCredentials,
            'apiKey' | 'bearerToken' | 'clientId' | 'clientSecret' | 'username' | 'password' | 'customFields'
        >
    > = {},
    expiresAt?: number
): ConnectorCredentials {
    return {
        connectorId,
        credentialType,
        ...fields,
        customFields: fields.customFields ? { ...fields.customFields } : undefined,
        createdAt: Date.now(),
        expiresAt,
    };
}

export function hasValidCredentials(
    credentials: ConnectorCredentials,
    now: number = Date.now()
): boolean {
    if (credentials.expiresAt !== undefined && now > credentials.expiresAt) {
        return false;
    }
    switch (credentials.credentialType) {
        case 'api_key':
            return credentials.apiKey !== undefined && credentials.apiKey.length > 0;
        case 'bearer_token':
            return credentials.bearerToken !== undefined && credentials.bearerToken.length > 0;
        case 'client_credentials':
            return (
                credentials.clientId !== undefined &&
                credentials.clientSecret !== undefined &&
                credentials.clientId.length > 0 &&
                credentials.clientSecret.length > 0
            );
        case 'basic_auth':
            return (
                credentials.username !== undefined &&
                credentials.password !== undefined &&
                credentials.username.length > 0 &&
                credentials.password.length > 0
            );
        case 'custom':
            return credentials.customFields !== undefined;
    }
}

export function getConnectorCredentials(
    state: ConnectorCredentialsState,
    connectorId: string
): ConnectorCredentials | undefined {
    return state.credentials.find((c) => c.connectorId === connectorId);
}

export function upsertConnectorCredentials(
    state: ConnectorCredentialsState,
    credentials: ConnectorCredentials
): ConnectorCredentialsState {
    const filtered = state.credentials.filter(
        (c) => c.connectorId !== credentials.connectorId
    );
    return {
        credentials: [...filtered, credentials],
    };
}

export function removeConnectorCredentials(
    state: ConnectorCredentialsState,
    connectorId: string
): ConnectorCredentialsState {
    return {
        credentials: state.credentials.filter((c) => c.connectorId !== connectorId),
    };
}