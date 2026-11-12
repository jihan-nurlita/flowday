import React, { useState } from 'react';
import { Calendar, Timer, BarChart3, ArrowRight, Check } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../../components/buttons/AppButtons';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Organize Your Day',
      subtitle: 'Plan with Clarity',
      description:
        'Structure your tasks using the Eisenhower Matrix and reserve dedicated calendar time blocks. Prioritize what truly moves the needle.',
      icon: Calendar,
      accentColor: '#A995D8',
      bgGlow: '#F4F1FA',
    },
    {
      title: 'Stay Focused',
      subtitle: 'Find Your Deep Flow',
      description:
        'Eliminate digital distractions with the built-in Pomodoro and Deep Work timers. Attach sessions to specific tasks to measure focus investment.',
      icon: Timer,
      accentColor: '#F1B8CC',
      bgGlow: '#FDF1F5',
    },
    {
      title: 'Track Your Progress',
      subtitle: 'Evaluate & Reflect',
      description:
        'Review genuine completion analytics calculated directly from your actions, and build a mindful habit with daily evening reflections.',
      icon: BarChart3,
      accentColor: '#A9C8E8',
      bgGlow: '#F0F6FC',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#FAF9FC] to-[#F4F1FA] dark:from-[#17151D] dark:to-[#201D27]">
      <div className="w-full max-w-lg bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] p-6 sm:p-10 shadow-[0_12px_40px_rgba(52,49,61,0.06)] flex flex-col justify-between min-h-[500px]">
        {/* Top Header: Brand & Skip Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#A995D8] flex items-center justify-center text-white text-xs font-bold">
              F
            </div>
            <span className="text-sm font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
              FlowDay
            </span>
          </div>

          <button
            onClick={onComplete}
            className="text-xs font-semibold text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>

        {/* Center: Slide Content */}
        <div className="py-6 flex flex-col items-center text-center animate-in fade-in duration-300" key={currentSlide}>
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xs"
            style={{ backgroundColor: `${slide.accentColor}20` }}
          >
            <Icon className="w-10 h-10" style={{ color: slide.accentColor }} />
          </div>

          <span
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: slide.accentColor }}
          >
            {slide.subtitle}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
            {slide.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-3 max-w-md leading-relaxed">
            {slide.description}
          </p>
        </div>

        {/* Bottom: Dots indicator & Actions */}
        <div className="flex flex-col gap-4">
          {/* Indicator dots */}
          <div className="flex items-center justify-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx
                    ? 'w-6 bg-[#A995D8]'
                    : 'w-2 bg-[#EEEAF2] dark:bg-[#2D2838] hover:bg-[#898493]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 pt-3">
            {currentSlide > 0 ? (
              <SecondaryButton
                onClick={() => setCurrentSlide((prev) => prev - 1)}
                size="md"
              >
                Back
              </SecondaryButton>
            ) : (
              <div />
            )}

            <PrimaryButton
              onClick={handleNext}
              size="md"
              icon={currentSlide === slides.length - 1 ? Check : ArrowRight}
              iconPosition="right"
            >
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
};
