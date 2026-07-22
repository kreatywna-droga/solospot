// providers/index.ts
export { LocalAssetStorage } from './LocalAssetStorage';
export { S3AssetStorage } from './S3AssetStorage';
export { R2AssetStorage } from './R2AssetStorage';
export type { StorageFactory, StorageConfig } from '../AssetStorage';