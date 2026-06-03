"use client";

import React from "react";

interface SliderProps {
  value: number;
  onChange: (val: number) => void;
}

export default function BlendSlider({ value, onChange }: SliderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between text-sm font-mono text-neutral-500 uppercase tracking-wider">
        <span className={value > 50 ? "text-primary font-semibold" : "text-neutral-700"}>
          Voice A: {value}%
        </span>
        <span className="font-semibold text-neutral-800">Voice Fusion Ratio</span>
        <span className={value < 50 ? "text-primary font-semibold" : "text-neutral-700"}>
          Voice B: {100 - value}%
        </span>
      </div>
      
      <div className="relative h-1.5 bg-neutral-200 rounded-full border border-neutral-300/40 flex items-center">
        {/* Track highlight */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-primary rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
        
        {/* Range Input element overlays track */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-4 opacity-0 cursor-pointer absolute z-10"
        />
        
        {/* Slider Thumb Visualization */}
        <div 
          className="absolute w-4 h-4 bg-white rounded-full border border-neutral-300 shadow-sm pointer-events-none transition-all duration-75"
          style={{ 
            left: `calc(${value}% - 8px)`,
          }}
        />
      </div>
    </div>
  );
}
