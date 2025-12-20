import React, { useEffect, useState } from "react";

const NatalMessageOverlay = ({
  isOpen = false,
  onClose = () => {},
  pages = [], // Array of content/components for pagination
  children = null, // Fallback for single page content
}) => {
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Use pages if provided, otherwise wrap children as a single page
  const contentPages = pages.length > 0 ? pages : [children];
  const isLastPage = currentPage === contentPages.length - 1;

  useEffect(() => {
    let timeout;
    if (isOpen) {
      // Reset to start when opening - wrapped to avoid sync setState warning
      const resetTimer = setTimeout(() => setCurrentPage(0), 0);
      timeout = setTimeout(() => setMounted(true), 10);
      return () => {
         clearTimeout(timeout);
         clearTimeout(resetTimer);
      };
    } else {
      timeout = setTimeout(() => setMounted(false), 10);
    }
    return () => clearTimeout(timeout);
  }, [isOpen]);

  // Click sound effect
  const playClickSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {
       // ignore
    }
  };

  const handleNext = () => {
    playClickSound();
    if (!isLastPage) setCurrentPage(p => p + 1);
  };

  const handlePrev = () => {
    playClickSound();
    if (currentPage > 0) setCurrentPage(p => p - 1);
  };

  const handleClose = () => {
    playClickSound();
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[10000] flex items-center justify-center transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Card Container */}
      <div 
        className={`relative w-full max-w-2xl bg-[#fffdf7] rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 ${mounted ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}
      >
        {/* Christmas Decorations */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-green-700 via-red-600 to-green-700" />
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-red-600 rounded-full blur-2xl opacity-20 pointer-events-none" />
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-green-600 rounded-full blur-3xl opacity-20 pointer-events-none" />

        {/* Content Area */}
        <div className="relative p-8 md:p-12 min-h-[400px] flex flex-col">
          
          {/* Header/Progress */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-1">
              {contentPages.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-2 rounded-full transition-all duration-300 ${idx === currentPage ? 'w-8 bg-red-600' : 'w-2 bg-gray-300'}`}
                />
              ))}
            </div>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Page Content */}
          <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-300 key={currentPage}">
            {contentPages[currentPage]}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <button 
              onClick={handlePrev}
              disabled={currentPage === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 0 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Previous
            </button>

            {isLastPage ? (
               <button 
                 onClick={handleClose}
                 className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg hover:shadow-red-500/30 font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
               >
                 <span>✨ Selesai</span>
               </button>
            ) : (
                <button 
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl shadow-lg font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Lanjut</span>
                  <span>→</span>
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NatalMessageOverlay;
