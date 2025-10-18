'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ImageResults({ results }) {
  const [sectionSelections, setSectionSelections] = useState({});
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  if (!results || !results.results || results.results.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 dark:text-gray-400 text-lg">No results found</p>
      </div>
    );
  }

  // Count sections with exactly 4 images selected
  const readySections = Object.values(sectionSelections).filter(
    selection => selection && selection.length === 4
  ).length;

  const handleBatchGenerate = async () => {
    if (readySections === 0) return;

    setIsBatchGenerating(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5228';

    try {
      // Generate collages for all sections with 4 images selected
      const promises = Object.entries(sectionSelections).map(async ([queryIndex, images]) => {
        if (images.length === 4) {
          const response = await fetch(`${apiUrl}/api/scraper/collage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imagePaths: images.map((img) => img.imageUrl),
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to generate collage for section ${queryIndex}`);
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const query = results.results[queryIndex].query.replace(/\s+/g, '_');
          a.download = `${query}_collage.jpg`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          return queryIndex;
        }
        return null;
      });

      await Promise.all(promises);

      // Clear all selections after successful generation
      setSectionSelections({});
      alert(`Successfully generated ${readySections} collages!`);
    } catch (error) {
      console.error('Error batch generating collages:', error);
      alert('Some collages failed to generate. Check console for details.');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* Summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-4xl font-semibold text-white">
              {results.totalQueries}
            </p>
            <p className="text-neutral-400 text-sm mt-1">Queries</p>
          </div>
          <div>
            <p className="text-4xl font-semibold text-white">
              {results.totalImages}
            </p>
            <p className="text-neutral-400 text-sm mt-1">Total Images</p>
          </div>
          <div>
            <p className="text-4xl font-semibold text-white">
              {Math.round(results.totalImages / results.totalQueries)}
            </p>
            <p className="text-neutral-400 text-sm mt-1">Per Query</p>
          </div>
        </div>
      </div>

      {/* Image Sections */}
      <div className="space-y-12">
        {results.results.map((queryResult, index) => (
          <ImageSection 
            key={index} 
            queryResult={queryResult} 
            index={index}
            selectedImages={sectionSelections[index] || []}
            onSelectionChange={(images) => {
              setSectionSelections(prev => ({
                ...prev,
                [index]: images
              }));
            }}
          />
        ))}
      </div>

      {/* Floating Batch Generate Button */}
      {readySections > 0 && (
        <button
          onClick={handleBatchGenerate}
          disabled={isBatchGenerating}
          className="fixed bottom-8 right-8 bg-white text-black font-bold py-4 px-6 rounded-full shadow-2xl hover:bg-neutral-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-50 flex items-center gap-3 text-sm"
        >
          {isBatchGenerating ? (
            <>
              <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Generate All ({readySections})
            </>
          )}
        </button>
      )}
    </div>
  );
}

function ImageSection({ queryResult, index, selectedImages, onSelectionChange }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const toggleSelection = (image) => {
    const isSelected = selectedImages.some((img) => img.imageUrl === image.imageUrl);
    let newSelection;
    if (isSelected) {
      newSelection = selectedImages.filter((img) => img.imageUrl !== image.imageUrl);
    } else if (selectedImages.length < 4) {
      newSelection = [...selectedImages, image];
    } else {
      return; // Already have 4 images
    }
    onSelectionChange(newSelection);
  };

  const isSelected = (image) => {
    return selectedImages.some((img) => img.imageUrl === image.imageUrl);
  };

  const handlePreviewCollage = async () => {
    if (selectedImages.length !== 4) return;

    setIsPreviewing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5228';
      const response = await fetch(`${apiUrl}/api/scraper/collage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagePaths: selectedImages.map((img) => img.imageUrl),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate preview. Please try again.');
      setIsPreviewing(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsPreviewing(false);
  };

  const handleGenerateCollage = async () => {
    if (selectedImages.length !== 4) return;

    setIsGenerating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5228';
      const response = await fetch(`${apiUrl}/api/scraper/collage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagePaths: selectedImages.map((img) => img.imageUrl),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate collage');
      }

      // Download the collage
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${queryResult.query.replace(/\s+/g, '_')}_collage.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Clear selection after successful generation
      onSelectionChange([]);
      
      // Close preview if open
      closePreview();
    } catch (error) {
      console.error('Error generating collage:', error);
      alert('Failed to generate collage. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      {/* Section Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 bg-neutral-800 text-neutral-400 font-medium rounded-lg text-sm border border-neutral-700">
              {index + 1}
            </span>
            <h2 className="text-xl font-semibold text-white">
              {queryResult.query}
            </h2>
          </div>
          
          {/* Preview and Generate Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviewCollage}
              disabled={selectedImages.length !== 4 || isPreviewing}
              className="px-4 py-2 bg-neutral-800 text-white font-medium rounded-lg transition-colors hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-neutral-700"
            >
              {isPreviewing ? 'Loading...' : '👁️ Preview'}
            </button>
            <button
              onClick={handleGenerateCollage}
              disabled={selectedImages.length !== 4 || isGenerating}
              className="px-4 py-2 bg-white text-black font-medium rounded-lg transition-colors hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isGenerating ? 'Generating...' : `Generate (${selectedImages.length}/4)`}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-neutral-600 rounded-full"></span>
            {queryResult.imageCount} images
          </span>
          {queryResult.success ? (
            <span className="text-neutral-400">✓ Success</span>
          ) : (
            <span className="text-red-400">✗ Failed</span>
          )}
          {selectedImages.length > 0 && (
            <span className="text-white font-medium">
              {selectedImages.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Images Grid - Bigger with fewer columns */}
      {queryResult.images && queryResult.images.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {queryResult.images.map((image, imgIndex) => (
            <ImageCard
              key={imgIndex}
              image={image}
              onClick={() => setSelectedImage(image)}
              onToggleSelect={() => toggleSelection(image)}
              selectionOrder={selectedImages.findIndex(img => img.imageUrl === image.imageUrl) + 1}
              canSelect={selectedImages.length < 4 || isSelected(image)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500 text-sm">
          No images found for this query
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          image={selectedImage} 
          images={queryResult.images}
          onClose={() => setSelectedImage(null)}
          onNext={(currentImage) => {
            const currentIndex = queryResult.images.findIndex(img => img.imageUrl === currentImage.imageUrl);
            if (currentIndex < queryResult.images.length - 1) {
              setSelectedImage(queryResult.images[currentIndex + 1]);
            }
          }}
          onPrevious={(currentImage) => {
            const currentIndex = queryResult.images.findIndex(img => img.imageUrl === currentImage.imageUrl);
            if (currentIndex > 0) {
              setSelectedImage(queryResult.images[currentIndex - 1]);
            }
          }}
          onToggleSelect={() => toggleSelection(selectedImage)}
          selectionOrder={selectedImages.findIndex(img => img.imageUrl === selectedImage.imageUrl) + 1}
          canSelect={selectedImages.length < 4 || isSelected(selectedImage)}
        />
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <CollagePreviewModal
          previewUrl={previewUrl}
          onClose={closePreview}
          onGenerate={handleGenerateCollage}
          isGenerating={isGenerating}
          queryName={queryResult.query}
        />
      )}
    </div>
  );
}

function ImageCard({ image, onClick, onToggleSelect, selectionOrder, canSelect }) {
  const [imageError, setImageError] = useState(false);
  
  // Use Pinterest URL directly (no local download)
  const imageUrl = image.imageUrl;
  const isSelected = selectionOrder > 0;

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (canSelect) {
      onToggleSelect();
    }
  };

  // Don't render if image failed to load
  if (imageError) {
    return null;
  }

  return (
    <div className="relative group cursor-pointer">
      <div className="relative aspect-[3/4] bg-neutral-900 rounded-lg overflow-hidden">
        <img
          src={imageUrl}
          alt={image.title || 'Pinterest image'}
          className="w-full h-full object-cover transition-transform hover:scale-105"
          onError={() => setImageError(true)}
          loading="lazy"
          onClick={onClick}
        />
        
        {/* Selection Button/Number */}
        <div className="absolute top-3 right-3">
          <button
            onClick={handleCheckboxClick}
            disabled={!canSelect && !isSelected}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-lg ${
              isSelected
                ? 'bg-white text-black'
                : 'bg-black bg-opacity-60 text-white border-2 border-white hover:bg-opacity-80'
            } ${!canSelect && !isSelected ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
          >
            {isSelected ? selectionOrder : '+'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageModal({ image, images, onClose, onNext, onPrevious, onToggleSelect, selectionOrder, canSelect }) {
  const [imageError, setImageError] = useState(false);
  
  // Use Pinterest URL directly (no local download)
  const imageUrl = image.imageUrl;

  const currentIndex = images.findIndex(img => img.imageUrl === image.imageUrl);
  const hasNext = currentIndex < images.length - 1;
  const hasPrevious = currentIndex > 0;
  const isSelected = selectionOrder > 0;

  const handleSelectClick = (e) => {
    e.stopPropagation();
    if (canSelect) {
      onToggleSelect();
    }
  };

  // Handle image load error - skip to next/previous or close
  useEffect(() => {
    if (imageError) {
      // Try to go to next image, or previous, or close if no other images
      if (hasNext) {
        onNext(image);
      } else if (hasPrevious) {
        onPrevious(image);
      } else {
        onClose();
      }
      setImageError(false); // Reset error state for next image
    }
  }, [imageError, hasNext, hasPrevious, image, onNext, onPrevious, onClose]);

  // Add keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && hasNext) {
        onNext(image);
      } else if (e.key === 'ArrowLeft' && hasPrevious) {
        onPrevious(image);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, hasNext, hasPrevious, onNext, onPrevious, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-6xl max-h-[90vh] w-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-neutral-400 hover:text-white transition-colors z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Previous button */}
        {hasPrevious && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevious(image);
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white text-black p-3 rounded-full hover:bg-neutral-100 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Next button */}
        {hasNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext(image);
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-black p-3 rounded-full hover:bg-neutral-100 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Image counter */}
        <div className="absolute -top-12 left-0 text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Image */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={image.title || 'Pinterest image'}
            className="w-full h-auto max-h-[70vh] object-contain bg-neutral-950"
            onClick={(e) => e.stopPropagation()}
            onError={() => setImageError(true)}
          />
          
          {/* Image details */}
          <div className="p-6 bg-neutral-900">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                {image.title || 'Untitled'}
              </h3>
              
              {/* Selection Button */}
              <button
                onClick={handleSelectClick}
                disabled={!canSelect && !isSelected}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-lg flex-shrink-0 ml-4 ${
                  isSelected
                    ? 'bg-white text-black'
                    : 'bg-neutral-800 text-white border-2 border-neutral-600 hover:border-white hover:bg-neutral-700'
                } ${!canSelect && !isSelected ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
              >
                {isSelected ? selectionOrder : '+'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500 text-xs">Dimensions</p>
                <p className="font-medium text-neutral-200 text-base mt-1">
                  {image.width} × {image.height}
                </p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Quality</p>
                <p className="font-medium text-neutral-200 text-base mt-1">
                  {image.quality || 'High Quality'}
                </p>
              </div>
            </div>
            
            {image.sourceUrl && (
              <a
                href={image.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-white hover:text-neutral-300 transition-colors text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                View on Pinterest →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CollagePreviewModal({ previewUrl, onClose, onGenerate, isGenerating, queryName }) {
  // Handle keyboard listener for Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-neutral-400 hover:text-white transition-colors z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="absolute -top-12 left-0 text-white">
          <h3 className="text-lg font-semibold mb-1">Collage Preview</h3>
          <p className="text-sm text-neutral-400">{queryName}</p>
        </div>

        {/* Preview Image - 9:16 Aspect Ratio */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
            <img
              src={previewUrl}
              alt="Collage preview"
              className="absolute inset-0 w-full h-full object-cover bg-neutral-950"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="p-6 bg-neutral-900 flex flex-col gap-4">
            <p className="text-neutral-400 text-sm text-center">
              9:16 Portrait Format • Perfect for Instagram Stories
            </p>
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="flex-1 px-5 py-2.5 bg-neutral-800 text-white font-medium rounded-lg transition-colors hover:bg-neutral-700 text-sm border border-neutral-700"
              >
                Close
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerate();
                }}
                disabled={isGenerating}
                className="flex-1 px-5 py-2.5 bg-white text-black font-medium rounded-lg transition-colors hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </span>
                ) : (
                  '📥 Download'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
