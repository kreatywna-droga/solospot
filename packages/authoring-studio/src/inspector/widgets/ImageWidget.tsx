'use client';

import * as React from 'react';
import { Upload, Trash2, Image as ImageIcon, Sparkles, RefreshCw, FolderOpen } from 'lucide-react';
import type { WidgetProps } from '../registry/types';
import { inputBaseClass, labelClass } from './WidgetShared';

interface ImageShape {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: string;
}

const defaultImage: ImageShape = {
  src: '',
  alt: '',
  width: undefined,
  height: undefined,
  objectFit: 'cover',
};

function parseImage(value: unknown): ImageShape {
  if (typeof value === 'string') {
    return { ...defaultImage, src: value };
  }
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return {
      src: typeof v.src === 'string' ? v.src : defaultImage.src,
      alt: typeof v.alt === 'string' ? v.alt : defaultImage.alt,
      width: v.width !== undefined ? (v.width as any) : defaultImage.width,
      height: v.height !== undefined ? (v.height as any) : defaultImage.height,
      objectFit: typeof v.objectFit === 'string' ? v.objectFit : defaultImage.objectFit,
    };
  }
  return defaultImage;
}

const FIT_OPTIONS = [
  { label: 'Cover (Wypełnij)', value: 'cover' },
  { label: 'Contain (Zmieść)', value: 'contain' },
  { label: 'Fill (Rozciągnij)', value: 'fill' },
  { label: 'None (Brak skalowania)', value: 'none' },
  { label: 'Scale-down (Zmniejsz)', value: 'scale-down' },
];

const ImageWidget: React.FC<WidgetProps<ImageShape | string>> = ({ value, onChange }) => {
  const isFlatString = typeof value === 'string';
  const img = parseImage(value);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [showAssetPicker, setShowAssetPicker] = React.useState(false);
  const [assets, setAssets] = React.useState<Array<{ id: string; publicUrl: string; originalName: string }>>([]);
  const [loadingAssets, setLoadingAssets] = React.useState(false);

  const update = (partial: Partial<ImageShape>) => {
    const next: ImageShape = { ...img, ...partial };
    onChange((isFlatString ? (next.src ?? '') : next) as any);
  };

  const getStoreId = (): string => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/studio\/([^/?#]+)/);
      if (match && match[1]) return match[1];
    }
    return 'default';
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    const storeId = getStoreId();

    try {
      // 1. Attempt upload to store assets API
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/stores/${storeId}/assets`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.asset?.publicUrl) {
        update({ src: data.asset.publicUrl });
        setIsUploading(false);
        return;
      }
    } catch {
      // Fall through to local data URL fallback
    }

    // 2. High-reliability fallback: Read file as Data URL locally
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        update({ src: dataUrl });
      }
      setIsUploading(false);
    };
    reader.onerror = () => setIsUploading(false);
    reader.readAsDataURL(file);
  };

  const handleOpenAssetPicker = async () => {
    setShowAssetPicker(true);
    setLoadingAssets(true);
    const storeId = getStoreId();
    try {
      const res = await fetch(`/api/stores/${storeId}/assets`);
      const data = await res.json();
      if (data.success && Array.isArray(data.assets)) {
        setAssets(data.assets);
      }
    } catch {
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* Image Preview / Drop Area */}
      <div className="relative w-full rounded-xl overflow-hidden bg-[#090912] border border-white/10 group">
        {img.src ? (
          <div className="relative h-28 w-full bg-black/40 flex items-center justify-center overflow-hidden">
            <img
              src={img.src}
              alt={img.alt || 'Podgląd obrazu'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = '0.3';
              }}
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-lg transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                Zmień
              </button>
              <button
                type="button"
                onClick={() => update({ src: '' })}
                className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white shadow-lg transition-all"
                title="Usuń zdjęcie"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-24 w-full flex flex-col items-center justify-center gap-1.5 p-3 cursor-pointer hover:bg-white/5 transition-colors border border-dashed border-white/20 rounded-xl"
          >
            <ImageIcon className="w-6 h-6 text-slate-500" />
            <span className="text-[11px] text-slate-400 font-medium">Kliknij, aby wgrać zdjęcie z dysku</span>
            <span className="text-[9px] text-slate-600">lub wklej adres URL poniżej</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-semibold transition-all disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          {isUploading ? 'Wgrywanie...' : 'Wgraj z dysku'}
        </button>
        <button
          type="button"
          onClick={handleOpenAssetPicker}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Biblioteka
        </button>
      </div>

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="p-3 bg-[#0d0d1a] border border-white/15 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-white uppercase tracking-wider">
            <span>Dostępne pliki</span>
            <button
              type="button"
              onClick={() => setShowAssetPicker(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          {loadingAssets ? (
            <div className="py-4 text-center text-xs text-slate-500">Ładowanie biblioteki...</div>
          ) : assets.length === 0 ? (
            <div className="py-3 text-center text-xs text-slate-500">Brak wgranych plików w sklepie</div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    update({ src: asset.publicUrl });
                    setShowAssetPicker(false);
                  }}
                  className="group relative rounded-lg overflow-hidden border border-white/10 hover:border-violet-500 aspect-square bg-black/50"
                >
                  <img
                    src={asset.publicUrl}
                    alt={asset.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Direct URL Input */}
      <div>
        <label className={labelClass}>Adres URL zdjęcia (Source URL)</label>
        <input
          type="text"
          value={img.src || ''}
          onChange={(e) => update({ src: e.target.value })}
          placeholder="https://images.unsplash.com/..."
          className={inputBaseClass}
        />
      </div>

      {/* Alt Text */}
      <div>
        <label className={labelClass}>Tekst alternatywny (Alt text)</label>
        <input
          type="text"
          value={img.alt || ''}
          onChange={(e) => update({ alt: e.target.value })}
          placeholder="Opis zdjęcia dla wyszukiwarek (SEO)"
          className={inputBaseClass}
        />
      </div>

      {/* Object Fit */}
      <div>
        <label className={labelClass}>Dopasowanie (Object Fit)</label>
        <select
          value={img.objectFit || 'cover'}
          onChange={(e) => update({ objectFit: e.target.value })}
          className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50 transition-all cursor-pointer"
        >
          {FIT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default React.memo(ImageWidget);


