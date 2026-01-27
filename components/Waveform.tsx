import React from 'react';

interface WaveformProps {
  isActive: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="flex items-center gap-1 h-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1 bg-current rounded-full waveform-bar"
          style={{ height: `${20 + i * 10}%` }}
        />
      ))}
    </div>
  );
};
