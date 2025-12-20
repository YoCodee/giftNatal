import React, { useState, useEffect } from "react";

const DialogBox = ({ isOpen, onComplete, dialogData }) => {
  const [currentDialog, setCurrentDialog] = useState(0);
  const [animate, setAnimate] = useState(false);

  // Default dialog content if none provided
  const defaultDialogs = [
    {
      name: "Santa",
      text: "Hohoho, welcome to my world",
      image: "/images/Santaa.png"
    }
  ];

  const dialogs = dialogData || defaultDialogs;

  useEffect(() => {
    if (isOpen) {
      if (document.pointerLockElement) document.exitPointerLock();
      
      // Small delay to trigger entry animation
      const timer = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setAnimate(false);
        setCurrentDialog(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const playClickSound = () => {
    try {
      // Create a premium "pop" sound using Web Audio API
      // This ensures it works immediately without needing an external asset
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
         // Fallback for very old browsers
         const audio = new Audio("/music/click.mp3");
         audio.volume = 0.5;
         audio.play();
      }
    } catch {
      // Silent fail
    }
  };

  const handleNext = () => {
    playClickSound();
    if (currentDialog < dialogs.length - 1) {
      setCurrentDialog(currentDialog + 1);
    } else {
      // Finished all dialogs
      if (onComplete) onComplete();
    }
  };

  const currentData = dialogs[currentDialog];

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-end pointer-events-auto">
      {/* Dark overlay backdrop to block scene and focus attention */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-700 ${
          animate ? "opacity-100" : "opacity-0"
        }`} 
      />

      {/* Main Content Wrapper - Anchored to bottom */}
      <div className="relative z-10 w-full max-w-[95%] xl:max-w-7xl px-4 flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 pb-8 md:pb-14">
        
        {/* Character Image - Large & Animated */}
        <div 
          className={`flex-shrink-0 transition-all duration-700 ease-out transform ${
            animate ? "translate-x-0 opacity-100" : "-translate-x-20 opacity-0"
          }`}
        >
             {/* Glow effect behind Santa */}
             <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full scale-75 animate-pulse"></div>
             
             <img 
               src={currentData.image} 
               alt={currentData.name} 
               className="relative w-64 md:w-[450px] lg:w-[400px] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] object-contain"
             />
        </div>

        {/* Dialog Content Box */}
        <div 
          className={`relative bg-black/80 border-2 border-yellow-600/50 p-6 md:p-10 rounded-2xl w-full md:flex-1 text-white shadow-2xl transition-all duration-700 delay-200 ease-out transform ${
            animate ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
          }`}
        >
            {/* Name Tag */}
            <div className="absolute -top-7 left-8 bg-gradient-to-r from-yellow-700 to-yellow-600 px-8 py-2 rounded-t-xl border-t border-x border-yellow-300/30 shadow-lg transform -skew-x-12 origin-bottom-left">
                <span className="block transform skew-x-12 font-bold text-xl md:text-2xl tracking-widest text-white shadow-black drop-shadow-md font-serif">
                    {currentData.name}
                </span>
            </div>

            {/* Dialog Text with Typewriter Effect */}
            <div className="text-xl md:text-3xl leading-relaxed tracking-wide font-medium mt-4 md:mt-2 text-yellow-50 drop-shadow-md min-h-[120px]">
                {currentData.text}
            </div>

            {/* Next Button */}
            <div className="flex justify-end mt-6">
                <button 
                    onClick={handleNext}
                    className="group bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/50 px-6 py-2 rounded-full flex items-center gap-3 text-yellow-300 hover:text-white transition-all duration-300 hover:scale-105"
                >
                    <span className="text-lg font-bold uppercase tracking-wider">Next</span>
                    <span className="text-xl group-hover:translate-x-1 transition-transform">➤</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};



export default DialogBox;
