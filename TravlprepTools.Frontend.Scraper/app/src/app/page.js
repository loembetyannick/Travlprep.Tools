'use client';

import { useState } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import ImageResults from './components/ImageResults';

export default function Home() {
  const [batchText, setBatchText] = useState('');
  const [extension, setExtension] = useState('');
  const [imageCount, setImageCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentQuery: '' });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!batchText.trim()) {
      setError('Please enter at least one search query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    // Calculate progress
    const queries = batchText.split('\n').filter(q => q.trim()).length;
    setProgress({ current: 0, total: queries, currentQuery: 'Starting...' });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5228';
      const params = new URLSearchParams({
        count: imageCount.toString(),
        downloadImages: 'false'
      });
      
      if (extension.trim()) {
        params.append('extension', extension.trim());
      }

      // Simulate progress tracking
      const progressInterval = setInterval(() => {
        setProgress(prev => ({
          ...prev,
          current: Math.min(prev.current + 0.2, prev.total - 0.5)
        }));
      }, 500);

      const response = await fetch(`${apiUrl}/api/scraper/pinterest/batch/text?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: batchText,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setProgress({ current: queries, total: queries, currentQuery: 'Complete!' });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch images. Make sure the API is running.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-semibold text-white mb-3 tracking-tight">
            Pinterest Image Scraper
          </h1>
          <p className="text-neutral-400 text-base">
            Get 20 high-quality images for each activity
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-4xl mx-auto mb-12">
          <form onSubmit={handleSubmit} className="bg-neutral-900 rounded-lg p-8 border border-neutral-800">
            <div className="mb-6">
              <label className="block text-neutral-200 font-medium mb-2 text-sm">
                Enter Activities (one per line)
              </label>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="Snow mobile safari&#10;Santa Claus village&#10;Huski sleigh&#10;Northern lights observation&#10;Glass igloo hotel"
                className="w-full h-64 px-4 py-3 border border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500 transition-colors bg-neutral-800 text-white font-mono text-sm resize-none placeholder-neutral-600"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-neutral-500">
                Paste your list here - one activity per line
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-neutral-200 font-medium mb-2 text-sm">
                  Images per query
                </label>
                <input
                  type="number"
                  value={imageCount}
                  onChange={(e) => setImageCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 20)))}
                  min="1"
                  max="50"
                  className="w-full px-4 py-3 border border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500 transition-colors bg-neutral-800 text-white text-sm"
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Number of images to scrape (1-50)
                </p>
              </div>

              <div>
                <label className="block text-neutral-200 font-medium mb-2 text-sm">
                  Extension (optional)
                </label>
                <input
                  type="text"
                  value={extension}
                  onChange={(e) => setExtension(e.target.value)}
                  placeholder="e.g., lapland, arctic finland"
                  className="w-full px-4 py-3 border border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500 transition-colors bg-neutral-800 text-white text-sm placeholder-neutral-600"
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Add to each query (e.g., &ldquo;Snow mobile safari lapland&rdquo;)
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-950 border border-red-900 rounded-lg">
                <p className="text-red-300 text-sm">⚠️ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-medium py-3 px-6 rounded-lg transition-colors hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Scraping Pinterest...' : 'Scrape Images'}
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner progress={progress} />}

        {/* Results */}
        {results && !loading && <ImageResults results={results} />}
      </div>
    </div>
  );
}
