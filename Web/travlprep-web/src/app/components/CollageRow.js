'use client';

import { useState } from 'react';
import { downloadCollage, downloadAllCollages, formatLabel } from '../utils';

export default function CollageRow({ row, onPreview, onRemove }) {
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showShadow, setShowShadow] = useState(true);

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      await downloadAllCollages(row.collages, showShadow);
    } catch (err) {
      console.error('Batch download failed:', err);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleDownloadSingle = async (collage) => {
    setDownloadingId(collage.id);
    try {
      await downloadCollage(collage, showShadow);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-white capitalize">
            {row.groupName}
          </h2>
          <span className="text-neutral-500 text-sm">
            {row.collages.length} collage
            {row.collages.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Shadow toggle */}
          <button
            onClick={() => setShowShadow((s) => !s)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              showShadow ? 'text-white' : 'text-neutral-500'
            }`}
          >
            <div
              className={`w-7 h-4 rounded-full transition-colors relative ${
                showShadow ? 'bg-white' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                  showShadow ? 'left-3.5 bg-black' : 'left-0.5 bg-neutral-400'
                }`}
              />
            </div>
            Shadow
          </button>

          {row.collages.length > 1 && (
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg transition-colors hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isDownloadingAll ? (
                <>
                  <Spinner className="w-4 h-4 border-black" />
                  Downloading...
                </>
              ) : (
                <>
                  <DownloadIcon className="w-4 h-4" />
                  Download All
                </>
              )}
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-2 text-neutral-600 hover:text-red-400 transition-colors"
            title="Remove row"
          >
            <svg
              className="w-4 h-4"
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
        </div>
      </div>

      {/* Horizontal scrolling row of collage cards */}
      <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-thin">
        {row.collages.map((collage) => (
          <CollageCard
            key={collage.id}
            collage={collage}
            showShadow={showShadow}
            onPreview={() => onPreview({ ...collage, showShadow })}
            onDownload={() => handleDownloadSingle(collage)}
            isDownloading={downloadingId === collage.id}
          />
        ))}
      </div>
    </div>
  );
}

function CollageCard({ collage, showShadow, onPreview, onDownload, isDownloading }) {
  const sorted = [...collage.images].sort(
    (a, b) => a.sequenceNum - b.sequenceNum
  );
  const label = formatLabel(collage.name);

  return (
    <div className="flex-shrink-0 w-72">
      {/* 2x2 Grid — 9:16 aspect ratio, no gaps */}
      <div
        className="relative rounded-lg overflow-hidden cursor-pointer group"
        style={{ aspectRatio: '9/16' }}
        onClick={onPreview}
      >
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {sorted.slice(0, 4).map((image, i) => (
            <div key={i} className="relative bg-neutral-800 overflow-hidden">
              <img
                src={image.url}
                alt={image.filename}
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            </div>
          ))}
          {Array.from({ length: Math.max(0, 4 - sorted.length) }).map(
            (_, i) => (
              <div
                key={`empty-${i}`}
                className="bg-neutral-800 flex items-center justify-center"
              >
                <span className="text-neutral-600 text-xs">Empty</span>
              </div>
            )
          )}
        </div>
        {/* Location label */}
        <div className="absolute inset-x-0 flex justify-center items-center pointer-events-none" style={{ top: '44%' }}>
          <span className="text-xs">📍</span>
          <span className={`tiktok-label text-xs ${showShadow ? '' : 'no-shadow'}`}>
            {label}
          </span>
        </div>
      </div>

      {/* Label + Download */}
      <div className="mt-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {label}
          </p>
          <p className="text-neutral-500 text-xs">
            {collage.images.length} image{collage.images.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          disabled={isDownloading}
          className="p-2 text-neutral-400 hover:text-white transition-colors disabled:opacity-50 flex-shrink-0"
          title="Download collage"
        >
          {isDownloading ? (
            <Spinner className="w-5 h-5 border-neutral-400" />
          ) : (
            <DownloadIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

function DownloadIcon({ className }) {
  return (
    <svg
      className={className}
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
  );
}

function Spinner({ className }) {
  return (
    <div
      className={`border-2 border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
}
