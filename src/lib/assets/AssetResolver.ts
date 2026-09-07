import type { UniversalAsset, AssetSlotType } from './AssetTypes';

export interface AssetNodeMutationPayload {
  props?: Record<string, any>;
  styles?: Record<string, any>;
}

/**
 * AssetResolver
 * Resolves a UniversalAsset into exact BuilderNode mutation payloads
 * based on the target Universal Asset Slot type.
 */
export function resolveAssetToMutationPayload(
  asset: UniversalAsset,
  slotType: AssetSlotType
): AssetNodeMutationPayload {
  const url = asset.sourceUrl || asset.previewUrl;
  const providerMeta = {
    provider: asset.provider,
    providerAssetId: asset.providerAssetId,
    licenseId: asset.license?.licenseId,
    attributionRequired: asset.license?.attributionRequired || false,
    author: asset.author,
    title: asset.title,
  };

  switch (slotType) {
    case 'IMAGE':
      return {
        props: {
          src: url,
          alt: asset.title || 'Image',
          assetMetadata: providerMeta,
        },
      };

    case 'BACKGROUND_IMAGE':
      return {
        styles: {
          backgroundImage: `url("${url}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        },
        props: {
          bgAssetMetadata: providerMeta,
        },
      };

    case 'VIDEO':
      return {
        props: {
          videoUrl: url,
          src: url,
          videoAssetMetadata: providerMeta,
          controls: true,
        },
      };

    case 'BACKGROUND_VIDEO':
      return {
        props: {
          backgroundVideo: url,
          backgroundVideoUrl: url,
          bgVideoAssetMetadata: providerMeta,
          autoplay: true,
          loop: true,
          muted: true,
          playsInline: true,
        },
      };

    case 'SVG':
    case 'ICON':
      return {
        props: {
          iconUrl: url,
          iconMetadata: providerMeta,
        },
      };

    default:
      return {
        props: {
          src: url,
          assetMetadata: providerMeta,
        },
      };
  }
}

/**
 * Dispatches the resolved asset mutation payload to the Builder document.
 */
export function applyAssetToNode(
  dispatch: (action: any) => void,
  nodeId: string,
  asset: UniversalAsset,
  slotType: AssetSlotType
): void {
  const payload = resolveAssetToMutationPayload(asset, slotType);
  
  dispatch({
    type: 'UPDATE_NODE',
    nodeId,
    updates: payload,
  });
}
