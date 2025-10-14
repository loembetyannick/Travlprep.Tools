export default function LoadingSpinner({ progress }) {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        {/* Outer spinning ring */}
        <div className="w-24 h-24 border-4 border-neutral-800 border-t-white rounded-full animate-spin"></div>
        
        {/* Progress percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{percentage}%</span>
        </div>
      </div>
      
      <div className="mt-6 text-center max-w-md">
        <h3 className="text-xl font-semibold text-white mb-2">
          Scraping Pinterest...
        </h3>
        <p className="text-neutral-400 text-base mb-4">
          Finding high-quality images for your activities
        </p>
        
        {/* Progress info */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-neutral-400 text-sm">Progress</span>
            <span className="text-white font-medium text-sm">
              {Math.floor(progress.current)} / {progress.total} queries
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Progress dots */}
        <div className="flex gap-2 justify-center mt-6">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

