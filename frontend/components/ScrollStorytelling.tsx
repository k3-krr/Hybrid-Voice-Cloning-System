"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function ScrollStorytelling() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress of this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Transform values for animation based on scroll progress (0 to 1)
  // Voice A moves from left to center
  const voiceAX = useTransform(scrollYProgress, [0.1, 0.45], ["-60px", "0px"]);
  const voiceAOpacity = useTransform(scrollYProgress, [0.1, 0.45, 0.6], [0.4, 0.8, 0]);
  
  // Voice B moves from right to center
  const voiceBX = useTransform(scrollYProgress, [0.1, 0.45], ["60px", "0px"]);
  const voiceBOpacity = useTransform(scrollYProgress, [0.1, 0.45, 0.6], [0.4, 0.8, 0]);

  // Hybrid Voice waveform reveal
  const hybridScale = useTransform(scrollYProgress, [0.4, 0.6, 0.85], [0.7, 1, 1]);
  const hybridOpacity = useTransform(scrollYProgress, [0.4, 0.55, 0.85], [0, 1, 1]);

  // Info label fade-in
  const textOpacity = useTransform(scrollYProgress, [0.55, 0.75], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.55, 0.75], [10, 0]);

  // Render bars for a waveform
  const renderWaveformBars = (count: number, seed: number, active: boolean) => {
    return Array.from({ length: count }).map((_, i) => {
      const phase = (i * 0.15) + seed;
      const heightVal = 8 + Math.abs(Math.sin(phase)) * 80; // heights between 8px and 88px
      return (
        <div
          key={i}
          className={`w-[2.5px] rounded-full mx-[2.5px] transition-all duration-300 ${
            active 
              ? "bg-primary" 
              : "bg-neutral-400/60"
          }`}
          style={{ height: `${heightVal}px` }}
        />
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[45vh] flex flex-col items-center justify-center overflow-hidden border-y border-[#e6e4df] bg-[#faf8f3]"
    >
      <div className="text-center mb-8 z-10 px-4">
        <h2 className="text-lg md:text-xl font-mono-extended text-neutral-500 mb-6 uppercase tracking-[0.25em]">
          VOICE FUSION TECHNOLOGY
        </h2>
        <p className="text-neutral-900 text-3xl md:text-5xl font-serif font-light max-w-4xl mx-auto leading-tight">
          Interpolating distinct speaker parameters to form a singular vocal target.
        </p>
      </div>

      <div className="relative flex items-center justify-center w-full h-40 z-10">
        {/* Voice A Waveform (Left Side) */}
        <motion.div
          style={{ x: voiceAX, opacity: voiceAOpacity }}
          className="absolute flex items-center pr-8 border-r border-dashed border-neutral-300"
        >
          <div className="text-right mr-4 hidden sm:block">
            <p className="text-[10px] font-mono text-neutral-400">VOICE A</p>
          </div>
          <div className="flex items-center h-28">
            {renderWaveformBars(12, 1.5, false)}
          </div>
        </motion.div>

        {/* Voice B Waveform (Right Side) */}
        <motion.div
          style={{ x: voiceBX, opacity: voiceBOpacity }}
          className="absolute flex items-center pl-8 border-l border-dashed border-neutral-300"
        >
          <div className="flex items-center h-28">
            {renderWaveformBars(12, 4.5, false)}
          </div>
          <div className="text-left ml-4 hidden sm:block">
            <p className="text-[10px] font-mono text-neutral-400">VOICE B</p>
          </div>
        </motion.div>

        {/* Blended/Hybrid Voice Waveform (Center Reveal) */}
        <motion.div
          style={{
            scale: hybridScale,
            opacity: hybridOpacity,
          }}
          className="absolute flex items-center justify-center px-4 py-3 bg-[#faf8f3] border border-neutral-300"
        >
          <div className="flex items-center h-16">
            {renderWaveformBars(18, 7.5, true)}
          </div>
        </motion.div>
      </div>

      {/* Powered text reveal below */}
      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="text-center mt-6 z-10 px-4"
      >
        <span className="text-[9px] font-mono text-primary uppercase tracking-[0.2em] inline-flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          XTTS-v2 Engine Calibration Active
        </span>
      </motion.div>
    </div>
  );
}
