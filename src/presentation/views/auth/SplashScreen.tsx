import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, durationMs = 1200 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [onComplete, durationMs]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#FAF9FC] via-[#F4F1FA] to-[#FAF9FC] dark:from-[#17151D] dark:via-[#201D27] dark:to-[#17151D] text-[#34313D] dark:text-[#F4F2F7]">
      <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
        {/* Soft Pastel Brand Logo */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#A995D8] via-[#F1B8CC] to-[#A9C8E8] flex items-center justify-center text-white shadow-[0_12px_36px_rgba(169,149,216,0.35)] animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -inset-2 bg-[#A995D8]/20 rounded-3xl blur-xl -z-10" />
        </div>

        {/* Brand Wordmark & Tagline */}
        <h1 className="text-3xl font-extrabold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
          FlowDay
        </h1>
        <p className="text-xs sm:text-sm font-medium text-[#898493] dark:text-[#9E99A8] mt-2 tracking-wide">
          Plan Your Day, Find Your Flow.
        </p>

        {/* Smooth spinner */}
        <div className="mt-8 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#A995D8] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#F1B8CC] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#A9C8E8] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
