"use client";

import React from "react";

interface SliderProps {
  value: number;
  onChange: (val: number) => void;
}

export default function BlendSlider({ value, onChange }: SliderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-primary">Voice 1: {value}%</span>
        <span className="text-white/60">Blend Ratio</span>
        <span className="text-blue-400">Voice 2: {100 - value}%</span>
      </div>
      
      <div className="relative h-2 bg-surface rounded-full overflow-hidden border border-border">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
