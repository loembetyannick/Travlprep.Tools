'use client';

import { useEffect, useState, useCallback } from 'react';
import { downloadCollage, formatLabel } from '../utils';

export default function PreviewModal({ collage, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const sorted = [...collage.images].sort(
    (a, b) => a.sequenceNum - b.sequenceNum
  );

  const showShadow = collage.showShadow ?? true;
  const label = formatLabel(collage.name);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadCollage(collage, showShadow);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-neutral-400 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Collage grid — compact 9:16 */}
        <div
          className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
          style={{ width: '280px' }}
        >
          <div className="relative" style={{ aspectRatio: '9/16' }}>
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              {sorted.slice(0, 4).map((image, i) => (
                <div key={i} className="relative bg-neutral-800 overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            {/* Location label */}
            <div className="absolute inset-x-0 flex justify-center items-center pointer-events-none" style={{ top: '44%' }}>
              <span className="text-sm">📍</span>
              <span className={`tiktok-label text-sm ${showShadow ? '' : 'no-shadow'}`}>
                {label}
              </span>
            </div>
          </div>

          {/* Title + Download */}
          <div className="p-3 flex items-center justify-between">
            <p className="text-white text-sm font-medium truncate">
              {label}
            </p>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3 py-1.5 bg-white text-black font-medium rounded-lg hover:bg-neutral-100 transition-colors text-xs flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
            >
              {isDownloading ? (
                <>
                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
