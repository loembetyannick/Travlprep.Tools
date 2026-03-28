'use client';

import { useState, useCallback, useRef } from 'react';
import CollageRow from './components/CollageRow';
import PreviewModal from './components/PreviewModal';
import { parseFilename } from './utils';

export default function Home() {
  const [rows, setRows] = useState([]);
  const [previewCollage, setPreviewCollage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [skippedFiles, setSkippedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const processFiles = useCallback((files) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (fileArray.length === 0) return;

    const collageMap = new Map();
    const skipped = [];

    fileArray.forEach((file) => {
      const parsed = parseFilename(file.name);
      if (!parsed) {
        skipped.push(file.name);
        return;
      }

      if (!collageMap.has(parsed.collageKey)) {
        collageMap.set(parsed.collageKey, {
          rowGroup: parsed.rowGroup,
          displayName: parsed.displayName,
          displayGroupName: parsed.displayGroupName,
          images: [],
        });
      }

      collageMap.get(parsed.collageKey).images.push({
        file,
        url: URL.createObjectURL(file),
        sequenceNum: parsed.sequenceNum,
        filename: file.name,
      });
    });

    if (skipped.length > 0) {
      setSkippedFiles(skipped);
      setTimeout(() => setSkippedFiles([]), 5000);
    }

    const rowMap = new Map();

    collageMap.forEach((collage, key) => {
      if (!rowMap.has(collage.rowGroup)) {
        rowMap.set(collage.rowGroup, {
          groupName: collage.displayGroupName,
          collages: [],
        });
      }

      collage.images.sort((a, b) => a.sequenceNum - b.sequenceNum);

      rowMap.get(collage.rowGroup).collages.push({
        id: crypto.randomUUID(),
        name: collage.displayName,
        collageKey: key,
        images: collage.images,
      });
    });

    const newRows = Array.from(rowMap.entries()).map(([, row]) => ({
      id: crypto.randomUUID(),
      groupName: row.groupName,
      collages: row.collages,
    }));

    setRows((prev) => [...prev, ...newRows]);
  }, []);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    processFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  const handleClearAll = () => {
    rows.forEach((row) =>
      row.collages.forEach((c) =>
        c.images.forEach((img) => URL.revokeObjectURL(img.url))
      )
    );
    setRows([]);
  };

  const handleRemoveRow = (rowId) => {
    setRows((prev) => {
      const row = prev.find((r) => r.id === rowId);
      if (row) {
        row.collages.forEach((c) =>
          c.images.forEach((img) => URL.revokeObjectURL(img.url))
        );
      }
      return prev.filter((r) => r.id !== rowId);
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-semibold text-white mb-3 tracking-tight">
            Collage Maker
          </h1>
          <p className="text-neutral-400 text-base">
            Upload sets of 4 photos to create downloadable collages
          </p>
        </div>

        {/* Upload Area */}
        <div className="max-w-4xl mx-auto mb-12">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-white bg-neutral-900'
                : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/50'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
            <svg
              className="w-12 h-12 mx-auto mb-4 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-neutral-300 font-medium mb-1">
              {isDragging ? 'Drop images here' : 'Click or drag images here'}
            </p>
            <p className="text-neutral-500 text-sm">
              Naming: <span className="text-neutral-400 font-mono">name_01-04.jpg</span>{' '}
              or{' '}
              <span className="text-neutral-400 font-mono">
                city_name_01-04.jpg
              </span>{' '}
              to group by city
            </p>
          </div>

          {/* Skipped files warning */}
          {skippedFiles.length > 0 && (
            <div className="mt-4 p-4 bg-amber-950/50 border border-amber-900/50 rounded-lg">
              <p className="text-amber-300 text-sm font-medium mb-1">
                {skippedFiles.length} file{skippedFiles.length !== 1 ? 's' : ''}{' '}
                skipped (unrecognized naming format)
              </p>
              <p className="text-amber-400/70 text-xs font-mono">
                {skippedFiles.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Summary + Clear */}
        {rows.length > 0 && (
          <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
            <p className="text-neutral-400 text-sm">
              {rows.length} row{rows.length !== 1 ? 's' : ''} &middot;{' '}
              {rows.reduce((sum, r) => sum + r.collages.length, 0)} collage
              {rows.reduce((sum, r) => sum + r.collages.length, 0) !== 1
                ? 's'
                : ''}
            </p>
            <button
              onClick={handleClearAll}
              className="text-neutral-500 hover:text-red-400 text-sm transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Collage Rows */}
        <div className="max-w-7xl mx-auto space-y-8">
          {rows.map((row) => (
            <CollageRow
              key={row.id}
              row={row}
              onPreview={setPreviewCollage}
              onRemove={() => handleRemoveRow(row.id)}
            />
          ))}
        </div>

        {/* Empty state */}
        {rows.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-600 text-lg">
              Upload images to get started
            </p>
          </div>
        )}

        {/* Preview Modal */}
        {previewCollage && (
          <PreviewModal
            collage={previewCollage}
            onClose={() => setPreviewCollage(null)}
          />
        )}
      </div>
    </div>
  );
}
