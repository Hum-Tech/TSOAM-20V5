import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

interface ZionSurfLoadingProps {
  onComplete: () => void;
}

export const ZionSurfLoading: React.FC<ZionSurfLoadingProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing System...');

  useEffect(() => {
    const loadingSteps = [
      { progress: 10, text: 'Initializing System...' },
      { progress: 25, text: 'Loading Authentication...' },
      { progress: 40, text: 'Connecting to Database...' },
      { progress: 55, text: 'Loading User Interface...' },
      { progress: 70, text: 'Preparing Dashboard...' },
      { progress: 85, text: 'Finalizing Setup...' },
      { progress: 100, text: 'Welcome to ZionSurf!' }
    ];

    let currentStep = 0;

    const progressInterval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setProgress(step.progress);
        setLoadingText(step.text);
        currentStep++;
      } else {
        clearInterval(progressInterval);
        // Complete loading after a short delay
        setTimeout(() => {
          onComplete();
        }, 800);
      }
    }, 600);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex flex-col items-center justify-center p-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-red-700/20 to-transparent rounded-full transform rotate-12"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-red-600/20 to-transparent rounded-full transform -rotate-12"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center space-y-8 max-w-md w-full">

        {/* Large Styled Text */}
        <div className="relative text-center space-y-6">
          {/* Main Brand Text */}
          <div className="relative">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-yellow-600/30 blur-3xl rounded-full scale-150"></div>

            {/* Main text */}
            <div className="relative">
              <h1 className="text-7xl md:text-8xl font-black tracking-tight leading-none">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent drop-shadow-2xl">
                  ZIONSURF
                </span>
              </h1>
            </div>

            {/* Decorative elements */}
            <div className="flex items-center justify-center mt-6 space-x-4">
              <div className="h-1 w-16 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-lg animate-pulse"></div>
              <div className="h-1 w-16 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full"></div>
            </div>
          </div>

          {/* Subtitle */}
          <div className="relative">
            <p className="text-xl md:text-2xl font-semibold text-white/90 tracking-wide leading-relaxed max-w-2xl mx-auto">
              An intelligent and integrated church management system
            </p>
            <p className="text-lg text-yellow-200/80 font-medium mt-3 tracking-wide">
              Excellence in Digital Ministry
            </p>
          </div>


        </div>

        {/* Loading progress */}
        <div className="w-full space-y-4 max-w-lg mx-auto">
          <div className="text-center">
            <p className="text-lg text-white font-semibold mb-3 tracking-wide">{loadingText}</p>
            <div className="flex items-center justify-center space-x-3 text-lg text-yellow-200">
              <span className="font-bold text-yellow-400">{progress}%</span>
              <span className="text-white/60">•</span>
              <span className="font-medium">Loading...</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative">
            <div className="w-full bg-red-900/60 rounded-full h-4 overflow-hidden border-2 border-yellow-400/30 shadow-lg">
              <div
                className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 h-full rounded-full transition-all duration-700 ease-out shadow-inner"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {/* Animated shine effect */}
            <div
              className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12"
              style={{
                left: `${progress - 12}%`,
                transition: 'left 0.7s ease-in-out'
              }}
            ></div>
          </div>
        </div>

        {/* Loading dots animation */}
        <div className="flex space-x-3 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-bounce shadow-lg border border-yellow-300/50"
              style={{
                animationDelay: `${i * 0.3}s`
              }}
            ></div>
          ))}
        </div>

        {/* Status text */}
        <div className="text-center text-sm text-yellow-100/80 pt-6 space-y-4">
          <div className="inline-block px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
            <p className="font-medium">Preparing Your Digital Ministry Platform</p>
            <p className="mt-1 text-xs text-white/60">Built for Excellence, Designed for Growth</p>
          </div>

          {/* Copyright */}
          <div className="pt-4 border-t border-white/10 max-w-xs mx-auto">
            <p className="text-xs text-yellow-200/60 font-medium">
              © 2025 ZIONSURF. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full opacity-60 animate-float shadow-sm ${
              i % 3 === 0 ? 'w-2 h-2 bg-yellow-400' :
              i % 3 === 1 ? 'w-1 h-1 bg-white' :
              'w-1.5 h-1.5 bg-yellow-300'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) scale(1);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-20px) scale(1.1);
              opacity: 0.6;
            }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `
      }} />
    </div>
  );
};

export default ZionSurfLoading;
