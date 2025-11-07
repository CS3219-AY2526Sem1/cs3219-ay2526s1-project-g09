import React from "react";

interface SuspenseFallbackProps {
  message?: string;
}

export const SuspenseFallback: React.FC<SuspenseFallbackProps> = ({
  message = "Loading...",
}) => {
  return (
    <div className="flex flex-1 h-[85vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-white/80">
        {/* Smooth Orbital Loading Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-teal-400 rounded-full animate-spin" />
        </div>

        {/* Animated Loading Text */}
        <p className="text-lg tracking-wide animate-pulse">{message}</p>
      </div>
    </div>
  );
};
