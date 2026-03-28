'use client';

import { useState } from 'react';
import { downloadCollage, downloadAllCollages } from '../utils';

export default function CollageRow({ row, onPreview, onRemove }) {
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      await downloadAllCollages(row.collages);
    } catch (err) {
      console.error('Batch download failed:', err);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleDownloadSingle = async (collage) => {
    setDownloadingId(collage.id);
    try {
      await downloadCollage(collage);
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

        <div className="flex items-center gap-2">
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
            onPreview={() => onPreview(collage)}
            onDownload={() => handleDownloadSingle(collage)}
            isDownloading={downloadingId === collage.id}
          />
        ))}
      </div>
    </div>
  );
}

function CollageCard({ collage, onPreview, onDownload, isDownloading }) {
  const sorted = [...collage.images].sort(
    (a, b) => a.sequenceNum - b.sequenceNum
  );

  return (
    <div className="flex-shrink-0 w-72">
      {/* 2x2 Grid — 9:16 aspect ratio, no gaps */}
      <div
        className="grid grid-cols-2 rounded-lg overflow-hidden cursor-pointer group"
        style={{ aspectRatio: '9/16' }}
        onClick={onPreview}
      >
        {sorted.slice(0, 4).map((image, i) => (
          <div key={i} className="bg-neutral-800 overflow-hidden">
            <img
              src={image.url}
              alt={image.filename}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
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

      {/* Label + Download */}
      <div className="mt-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-white text-sm font-medium capitalize truncate">
            {collage.name}
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
