import React from 'react';

export interface AssetCollectionsViewProps {
  collections?: ReadonlyArray<string>;
}

export const AssetCollectionsView: React.FC<AssetCollectionsViewProps> = ({
  collections = ['Favorites', 'Recently Used', 'Shared Team'],
}) => {
  return (
    <div data-testid="asset-collections-view" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <h5>Asset Collections</h5>
      {collections.map((c) => (
        <div key={c} style={{ padding: '4px', background: 'rgba(255,255,255,0.03)' }}>
          📁 {c}
        </div>
      ))}
    </div>
  );
};
