'use client';

import { useState } from 'react';
import {
  downloadCollage,
  downloadCover,
  downloadAllInRow,
  formatLabel,
} from '../utils';

export default function CollageRow({ row, onPreview, onRemove }) {
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showShadow, setShowShadow] = useState(true);
  const [coverImages, setCoverImages] = useState([]);

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      await downloadAllInRow(row.collages, coverImages, showShadow);
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

  const handleSetCover = (image, collage) => {
    const exists = coverImages.find(
      (c) => c.url === image.url && c.collageKey === collage.collageKey
    );
    if (exists) {
      setCoverImages((prev) =>
        prev.filter(
          (c) => !(c.url === image.url && c.collageKey === collage.collageKey)
        )
      );
    } else {
      setCoverImages((prev) => [
        ...prev,
        {
          url: image.url,
          filename: image.filename,
          label: collage.name,
          collageKey: collage.collageKey,
        },
      ]);
    }
  };

  const handleDownloadCover = async (cover) => {
    setDownloadingId(`cover-${cover.url}`);
    try {
      await downloadCover(cover.url, cover.collageKey);
    } catch (err) {
      console.error('Cover download failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRemoveCover = (cover) => {
    setCoverImages((prev) =>
      prev.filter(
        (c) => !(c.url === cover.url && c.collageKey === cover.collageKey)
      )
    );
  };

  const totalItems = coverImages.length + row.collages.length;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-white capitalize">
            {row.groupName}
          </h2>
          <span className="text-neutral-500 text-sm">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
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

      {/* Horizontal scrolling row */}
      <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-thin">
        {/* Cover photos first */}
        {coverImages.map((cover) => (
          <CoverCard
            key={`cover-${cover.url}`}
            cover={cover}
            showShadow={showShadow}
            onDownload={() => handleDownloadCover(cover)}
            onRemove={() => handleRemoveCover(cover)}
            isDownloading={downloadingId === `cover-${cover.url}`}
          />
        ))}

        {/* Collage cards */}
        {row.collages.map((collage) => (
          <CollageCard
            key={collage.id}
            collage={collage}
            showShadow={showShadow}
            coverImages={coverImages}
            onPreview={() => onPreview({ ...collage, showShadow })}
            onDownload={() => handleDownloadSingle(collage)}
            onSetCover={(image) => handleSetCover(image, collage)}
            isDownloading={downloadingId === collage.id}
          />
        ))}
      </div>
    </div>
  );
}

function CoverCard({ cover, showShadow, onDownload, onRemove, isDownloading }) {
  const label = formatLabel(cover.label);

  return (
    <div className="flex-shrink-0 w-72">
      <div
        className="relative rounded-lg overflow-hidden"
        style={{ aspectRatio: '9/16' }}
      >
        <img
          src={cover.url}
          alt={cover.filename}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Remove cover */}
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{label}</p>
          <p className="text-neutral-500 text-xs">Cover photo</p>
        </div>
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="p-2 text-neutral-400 hover:text-white transition-colors disabled:opacity-50 flex-shrink-0"
          title="Download cover"
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

function CollageCard({
  collage,
  showShadow,
  coverImages,
  onPreview,
  onDownload,
  onSetCover,
  isDownloading,
}) {
  const sorted = [...collage.images].sort(
    (a, b) => a.sequenceNum - b.sequenceNum
  );
  const label = formatLabel(collage.name);

  const isCover = (image) =>
    coverImages.some(
      (c) => c.url === image.url && c.collageKey === collage.collageKey
    );

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
              {/* Cover select button — visible on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetCover(image);
                }}
                className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center transition-all text-[10px] ${
                  isCover(image)
                    ? 'bg-white text-black opacity-100'
                    : 'bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70'
                }`}
                title={isCover(image) ? 'Remove cover' : 'Set as cover'}
              >
                <svg className="w-3.5 h-3.5" fill={isCover(image) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
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
        <div
          className="absolute inset-x-0 flex justify-center items-center pointer-events-none"
          style={{ top: '44%' }}
        >
          <span className="text-xs">📍</span>
          <span className={`tiktok-label text-xs ${showShadow ? '' : 'no-shadow'}`}>
            {label}
          </span>
        </div>
      </div>

      {/* Label + Download */}
      <div className="mt-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{label}</p>
          <p className="text-neutral-500 text-xs">
            {collage.images.length} image
            {collage.images.length !== 1 ? 's' : ''}
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
