/**
 * MediaLibraryConnector.ts — Sprint S8 External Services (ETAP 3)
 *
 * Media library connector contracts for managing media assets.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type MediaAssetType = 'image' | 'video' | 'audio' | 'document' | '3d_model' | 'custom';

export interface MediaAsset {
    readonly assetId: string;
    readonly name: string;
    readonly type: MediaAssetType;
    readonly mimeType: string;
    readonly sizeBytes: number;
    readonly width?: number;
    readonly height?: number;
    readonly durationMs?: number;
    readonly thumbnailUrl?: string;
    readonly sourceUrl?: string;
    readonly createdAt: number;
    readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface MediaLibrarySearchRequest {
    readonly connectorId: string;
    readonly query?: string;
    readonly type?: MediaAssetType;
    readonly tags?: ReadonlyArray<string>;
    readonly limit?: number;
    readonly offset?: number;
}

export interface MediaLibrarySearchResult {
    readonly connectorId: string;
    readonly success: boolean;
    readonly assets: ReadonlyArray<MediaAsset>;
    readonly totalCount: number;
    readonly errorMessage?: string;
}

export interface MediaLibraryConnectorContract {
    readonly connectorId: string;
    readonly search: (request: MediaLibrarySearchRequest) => MediaLibrarySearchResult;
    readonly getAsset: (connectorId: string, assetId: string) => MediaAsset | undefined;
    readonly uploadAsset: (connectorId: string, asset: MediaAsset, payload: unknown) => boolean;
    readonly deleteAsset: (connectorId: string, assetId: string) => boolean;
}

export function createMediaLibrarySearchRequest(
    connectorId: string,
    query?: string,
    type?: MediaAssetType,
    tags?: ReadonlyArray<string>,
    limit: number = 50,
    offset: number = 0
): MediaLibrarySearchRequest {
    return {
        connectorId,
        query,
        type,
        tags: tags ? [...tags] : undefined,
        limit,
        offset,
    };
}

export function createMediaLibrarySearchResult(
    connectorId: string,
    success: boolean,
    assets: ReadonlyArray<MediaAsset> = [],
    totalCount: number = 0,
    errorMessage?: string
): MediaLibrarySearchResult {
    return {
        connectorId,
        success,
        assets: [...assets],
        totalCount,
        errorMessage,
    };
}