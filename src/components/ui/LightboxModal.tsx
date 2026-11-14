import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface LightboxImageItem {
  id: string;
  fileName: string;
  caption?: string;
  dataUrl: string;
  width?: number;
  height?: number;
}

interface LightboxModalProps {
  items: LightboxImageItem[];
  initialIndex: number;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  items,
  initialIndex,
  onClose,
}) => {
  const { t } = useLanguage();
  const [index, setIndex] = useState(initialIndex);
  const current = items[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < items.length - 1) setIndex((i) => i + 1);
      if (e.key === 'ArrowLeft' && index > 0) setIndex((i) => i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onClose]);

  if (!current) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = current.dataUrl;
    link.download = current.fileName || 'asset.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 no-print"
      role="dialog"
      aria-modal="true"
      aria-label="Asset Viewer"
    >
      <div className="flex items-center justify-between gap-4 text-zinc-100">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{current.fileName}</p>
          <p className="text-xs font-mono tabular-nums text-zinc-400">
            {index + 1} / {items.length}
            {current.width && current.height ? ` · ${current.width}×${current.height}px` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#18181b] border border-[#27272a] hover:bg-zinc-800 rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#4ade80]" />
            {t.common.download}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="p-2 bg-[#18181b] border border-[#27272a] hover:bg-zinc-800 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative my-4">
        {index > 0 && (
          <button
            type="button"
            onClick={() => setIndex((i) => i - 1)}
            aria-label="Previous image"
            className="fixed left-4 sm:left-8 top-1/2 -translate-y-1/2 p-2.5 bg-[#18181b] border border-[#27272a] text-zinc-100 rounded-full hover:bg-zinc-800 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <img
          src={current.dataUrl}
          alt={current.caption || current.fileName}
          referrerPolicy="no-referrer"
          className="max-w-full max-h-[78vh] object-contain rounded-lg"
        />
        {index < items.length - 1 && (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            aria-label="Next image"
            className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 p-2.5 bg-[#18181b] border border-[#27272a] text-zinc-100 rounded-full hover:bg-zinc-800 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="text-center text-xs text-zinc-300">
        {current.caption || t.common.noCaption}
      </div>
    </div>
  );
};
