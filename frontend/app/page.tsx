"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Settings, 
  Download, 
  Play, 
  Pause, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles 
} from "lucide-react";
import AudioInputCard from "@/components/AudioInputCard";
import BlendSlider from "@/components/Slider";
import ScrollStorytelling from "@/components/ScrollStorytelling";

export default function Home() {
  const [voice1, setVoice1] = useState<File | null>(null);
  const [voice2, setVoice2] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [ratio, setRatio] = useState(50);
  const [language, setLanguage] = useState("en");
  const [noiseReduction, setNoiseReduction] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Custom Audio Player States for the Generated Hybrid Voice
  const [outputIsPlaying, setOutputIsPlaying] = useState(false);
  const [outputTime, setOutputTime] = useState(0);
  const [outputDuration, setOutputDuration] = useState(0);
  const outputAudioRef = useRef<HTMLAudioElement | null>(null);

  // Manage custom player events
  useEffect(() => {
    if (!audioUrl) {
      setOutputIsPlaying(false);
      setOutputTime(0);
      setOutputDuration(0);
      if (outputAudioRef.current) {
        outputAudioRef.current.pause();
        outputAudioRef.current = null;
      }
      return;
    }

    const audio = new Audio(audioUrl);
    outputAudioRef.current = audio;

    const handleLoadedMetadata = () => {
      setOutputDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setOutputTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setOutputIsPlaying(false);
      setOutputTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      outputAudioRef.current = null;
    };
  }, [audioUrl]);

  const toggleOutputPlayback = () => {
    if (!outputAudioRef.current) return;
    if (outputIsPlaying) {
      outputAudioRef.current.pause();
      setOutputIsPlaying(false);
    } else {
      outputAudioRef.current.play().catch(e => console.error("Playback failed", e));
      setOutputIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!outputAudioRef.current || !outputDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * outputDuration;
    outputAudioRef.current.currentTime = seekTime;
    setOutputTime(seekTime);
  };

  const handleGenerate = async () => {
    if (!voice1 || !voice2) {
      setError("Please provide both voice inputs (upload or record).");
      return;
    }
    if (!text.trim()) {
      setError("Please enter the text you want the voices to speak.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const formData = new FormData();
      formData.append("voice1", voice1);
      formData.append("voice2", voice2);
      formData.append("text", text);
      formData.append("ratio", ratio.toString());
      formData.append("language", language);
      formData.append("noise_reduction", noiseReduction ? "true" : "false");

      const backendUrl = "http://localhost:8000/api/generate";
      
      const response = await fetch(backendUrl, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        throw new Error(data.message || "Failed to generate audio.");
      }

      setAudioUrl(`http://localhost:8000${data.audio_url}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const sampleTexts = [
    { label: "Welcome", text: "Welcome to the future of voice cloning technology." },
    { label: "Hybrid Demo", text: "This is a blended hybrid voice generated with neural networks." },
    { label: "Greetings", text: "Hello Rithya, your project works perfectly." },
    { label: "Status", text: "AI speech synthesis is active and operating at peak performance." }
  ];

  const featuresList = [
    { num: "01", category: "INGESTION", title: "Upload Voice Samples", desc: "Analyze raw wav, mp3, or flac audio references directly in the browser environment." },
    { num: "02", category: "CAPTURING", title: "Record Voice Directly", desc: "Extract vocal profiles in real time using local hardware microphone configurations." },
    { num: "03", category: "FUSION", title: "AI Voice Fusion", desc: "Interpolate speaker embeddings using custom sliders for highly precise outputs." },
    { num: "04", category: "DECODING", title: "Fast Generation", desc: "Optimized sentence-greedy parameters ensure rapid compilation outputs on server nodes." },
    { num: "05", category: "LOCALIZATION", title: "Multi-Language Support", desc: "Generate native translations across English, Spanish, French, German, Italian, and Portuguese." }
  ];

  return (
    <div className="bg-[#FAF8F3] min-h-screen text-[#1A1A1A] font-sans selection:bg-primary/10 selection:text-primary">
      
      {/* Light-Theme Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF8F3]/85 backdrop-blur-md border-b border-[#E6E4DF] py-5 px-8 md:px-16 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xl md:text-2xl font-bold tracking-[0.25em] text-neutral-900">
            NEUROVOX
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-10 text-sm font-mono tracking-[0.15em] text-neutral-600 uppercase font-medium">
          <a href="#storytelling" className="hover:text-neutral-850 transition-colors">Technology</a>
          <a href="#features" className="hover:text-neutral-855 transition-colors">Features</a>
          <a href="#studio" className="hover:text-primary transition-colors text-primary font-semibold">Studio</a>
        </div>
        <div>
          <a 
            href="#studio" 
            className="text-sm font-mono tracking-[0.15em] border border-neutral-250 hover:border-neutral-350 bg-white px-5 py-2.5 rounded-sm transition-all uppercase shadow-sm font-semibold"
          >
            Studio
          </a>
        </div>
      </nav>

      {/* EDITORIAL HERO SECTION (Oversized text, controlled density) */}
      <section className="relative min-h-screen flex flex-col justify-start px-8 md:px-16 pt-50 pb-16 overflow-hidden border-b border-[#E6E4DF]">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ECE9E2_1px,transparent_1px),linear-gradient(to_bottom,#ECE9E2_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none opacity-40" />
        
        <div className="max-w-5xl z-10 flex flex-col items-center text-center mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 text-xs font-mono-extended text-neutral-500 uppercase tracking-[0.25em] font-semibold">
            <span>NEUROVOX SYSTEM v2.0</span>
          </div>

          <h1 className="font-serif leading-[0.9] tracking-tight">
  <span className="block text-[8rem] font-medium">
  NEUROVOX.
</span>

<span className="block mt-10 text-[3.5rem] font-light text-neutral-600">
  Hybrid Voice Cloning System.
</span>
</h1>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-start text-center mt-70">
            <div className="md:col-span-4 text-3xl text-neutral-500 uppercase tracking-[0.15em] font-semibold pt-1">
              ABSTRACT SYSTEM OVERVIEW
            </div>
            <div className="md:col-span-5 text-neutral-800 text-lg md:text-xl font-light leading-relaxed max-w-[600px]">
              A high-fidelity speech synthesis framework built to fuse vocal properties of two reference speaker embeddings. Shift proportions dynamically to construct a completely unique target condition.
            </div>
            <div className="md:col-span-3 flex justify-center">
              <a 
                href="#studio" 
                className="group inline-flex items-center gap-2 border border-neutral-250 hover:border-neutral-350 bg-white hover:bg-neutral-850 hover:text-white text-xs font-mono uppercase tracking-wider px-6 py-4 rounded-sm transition-all shadow-sm font-semibold"
              >
                Access Studio
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CONCISE SCROLL STORYTELLING SECTION */}
      <section id="storytelling" className="w-full">
        <ScrollStorytelling />
      </section>

      {/* EDITORIAL LIST-BASED FEATURE INDEX (Reduced spacing) */}
      <section id="features" className="py-20 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="mb-12 text-left">
          <h2 className="text-xs font-mono-extended text-neutral-500 uppercase tracking-[0.25em] mb-2 font-semibold">SPECIFICATIONS</h2>
          <p className="text-5xl md:text-6xl lg:text-7xl font-serifleading-[0.95] tracking-tight">Product capabilities and system features.</p>
        </div>

        {/* Hairline Row Index Items */}
        <div className="border-t border-[#E6E4DF]">
          {featuresList.map((feat, idx) => (
            <motion.div 
              key={idx}
              whileInView={{ opacity: 1 }}
              initial={{ opacity: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-12 py-7 border-b border-[#E6E4DF] gap-4 items-center group hover:bg-[#FAF8F3]/50 transition-colors"
            >
              <div className="md:col-span-2 text-xs font-mono text-neutral-500 flex items-center gap-2">
                <span>{feat.num}</span>
                <span className="text-[9px] text-neutral-500 font-mono-extended tracking-wider">[{feat.category}]</span>
              </div>
              <div className="md:col-span-4 text-lg md:text-xl font-serif font-medium text-neutral-900 tracking-tight uppercase">
                {feat.title}
              </div>
              <div className="md:col-span-6 text-sm md:text-base text-neutral-600 leading-relaxed font-light">
                {feat.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* VOICE CLONING STUDIO (ElevenLabs style: Light theme functional studio, reduced vertical pad) */}
      <section id="studio" className="py-20 px-8 md:px-16 max-w-6xl mx-auto scroll-mt-20 border-t border-[#E6E4DF]">
        <div className="text-left mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-mono-extended text-neutral-500 uppercase tracking-[0.2em] mb-3 font-semibold">
    FUSION CONTROL
  </h2>
            <p className="text-5xl md:text-6xl lg:text-7xl font-serif font-light tracking-tight text-neutral-900">
    Voice Studio
  </p>
          </div>
          <p className="text-base md:text-lg text-neutral-700 max-w-md font-light leading-relaxed">
    Upload or record reference voices, adjust fusion parameters, and generate your unique hybrid speech output with real-time controls and multi-language support.
          </p>
        </div>

        {/* Error Alert Box */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-start gap-3 bg-red-500/5 text-red-600 border border-red-200/50 px-5 py-4 rounded-md w-full mb-8"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">System Exception</h4>
                <p className="text-xs mt-1 text-red-500 font-light">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Voice Inputs & Blending Settings */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Reference Voice Inputs Cards - Grouped Container */}
            <div className="border border-border bg-surface rounded-lg p-6 flex flex-col gap-6 shadow-sm">
              <h3 className="text-base md:text-lg font-mono uppercase tracking-wider text-neutral-700 font-semibold">1. Speaker Verification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AudioInputCard title="Reference Voice A" onFileChange={setVoice1} />
                <AudioInputCard title="Reference Voice B" onFileChange={setVoice2} />
              </div>
            </div>

            {/* Voice Fusion Ratio Card */}
            <div className="border border-border bg-surface rounded-lg p-6 flex flex-col gap-4 shadow-sm">
              <h3 className="text-base md:text-lg font-mono uppercase tracking-wider text-neutral-700 font-semibold">2. Balance Alignment</h3>
              <BlendSlider value={ratio} onChange={setRatio} />
            </div>

            {/* Configuration Card */}
            <div className="border border-border bg-surface rounded-lg p-6 shadow-sm">
              <h3 className="text-base md:text-lg font-mono uppercase tracking-wider text-neutral-700 mb-6 flex items-center gap-1.5 font-semibold">
                <Settings size={12} /> 3. System Calibration
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-600 tracking-wider mb-2 font-semibold">Synthesizer Language</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-[#faf8f3]/80 border border-neutral-250 hover:border-neutral-350 rounded-md p-3 text-sm md:text-base text-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer font-mono"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="en">English (US)</option>
                      <option value="es">Spanish (Español)</option>
                      <option value="fr">French (Français)</option>
                      <option value="de">German (Deutsch)</option>
                      <option value="it">Italian (Italiano)</option>
                      <option value="pt">Portuguese (Português)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 text-[11px]">▼</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer group mt-4">
                    <div className="relative flex items-center justify-center shrink-0">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={noiseReduction}
                        onChange={(e) => setNoiseReduction(e.target.checked)}
                      />
                      <div className={`w-8 h-4.5 rounded-full transition-colors border ${
                        noiseReduction ? 'bg-primary border-primary' : 'bg-neutral-200 border-neutral-300'
                      }`}></div>
                      <div className={`absolute left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${
                        noiseReduction ? 'translate-x-3.5' : 'translate-x-0'
                      }`}></div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-neutral-800 group-hover:text-neutral-900 transition-colors block">Noise Control</span>
                      <span className="text-xs text-neutral-500 block leading-tight font-light">Reduce room ambient noise</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Text Area & Generation Output Studio (scale=5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Text To Synthesize Area */}
            <div className="border border-border bg-surface rounded-lg p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-base md:text-lg font-mono uppercase tracking-wider text-neutral-700 font-semibold">4. Target Transcript</h3>
                <span className="text-xs font-mono text-neutral-500">{text.length} chars</span>
              </div>
              
              <textarea
                className="w-full bg-[#faf8f3]/80 border border-neutral-250 hover:border-neutral-350 rounded-md p-4 text-sm md:text-base text-neutral-850 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary transition-all min-h-[120px] resize-none leading-relaxed"
                placeholder="Type transcription sequence here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              {/* Tag presets */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs font-mono text-neutral-500 mr-1 uppercase">Presets:</span>
                {sampleTexts.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setText(sample.text)}
                    className="text-xs font-mono border border-neutral-250 hover:border-neutral-350 bg-[#faf8f3] text-neutral-700 hover:text-neutral-900 px-2 py-0.5 rounded-sm transition-all"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Synthesizer Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !voice1 || !voice2 || !text.trim()}
              className="bg-primary hover:bg-primary-hover disabled:bg-neutral-100 disabled:text-neutral-400 text-white text-xs font-mono uppercase tracking-widest p-4 rounded-md flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:cursor-not-allowed border border-transparent font-semibold shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin text-white" size={14} />
                  <span>SYNTHESIZING MATRIX...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-white/80" />
                  <span>GENERATE HYBRID SPEECH</span>
                </>
              )}
            </button>

            {/* Generated Hybrid Voice Output Block */}
            <div className="border border-border bg-surface rounded-lg p-6 min-h-[220px] flex flex-col justify-center shadow-sm">
              
              {isGenerating ? (
                /* Sleek animated generation loader */
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="relative mb-4">
                    <div className="w-12 h-12 rounded-full border border-primary/20 animate-ping absolute" />
                    <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center relative">
                      <Loader2 className="animate-spin text-primary" size={18} />
                    </div>
                  </div>
                  <h4 className="text-xs font-semibold tracking-wider text-neutral-800 mb-1 font-mono uppercase">Vocal Rendering</h4>
                  <p className="text-[10px] text-neutral-400 max-w-[200px] leading-relaxed font-light">
                    Processing reference vectors and compiling hybrid spectral frequencies...
                  </p>
                </div>
              ) : audioUrl ? (
                /* Premium Custom Player Output Section */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base md:text-lg font-mono uppercase tracking-wider text-primary flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 size={12} /> Generated Hybrid Voice
                    </h3>
                    <span className="text-xs font-mono text-neutral-500">Verified</span>
                  </div>

                  {/* Custom Player waveform */}
                  <div 
                    onClick={handleSeek}
                    className="relative h-16 bg-[#faf8f3] border border-neutral-250/60 rounded-md flex items-center justify-between px-4 cursor-pointer group/wave overflow-hidden"
                  >
                    {/* Played portion highlight indicator */}
                    {outputDuration > 0 && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-100 ease-linear pointer-events-none"
                        style={{ width: `${(outputTime / outputDuration) * 100}%` }}
                      />
                    )}

                    {/* Styled Waveform Bars */}
                    <div className="flex items-center justify-between w-full h-10 gap-[2.5px] pointer-events-none">
                      {Array.from({ length: 40 }).map((_, idx) => {
                        const seed = idx * 0.15;
                        const heightMultiplier = 0.1 + Math.abs(Math.sin(seed + 1.2)) * 0.75 + Math.cos(seed * 2.3) * 0.1;
                        
                        const barFraction = idx / 40;
                        const progressFraction = outputDuration ? (outputTime / outputDuration) : 0;
                        const isPlayed = barFraction <= progressFraction;

                        return (
                          <div
                            key={idx}
                            className={`w-[2.5px] rounded-full transition-colors duration-150 ${
                              isPlayed ? "bg-primary" : "bg-neutral-300"
                            }`}
                            style={{ height: `${Math.max(4, heightMultiplier * 100)}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Player and Download controls */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleOutputPlayback}
                        className="w-8 h-8 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center text-white transition-colors shrink-0"
                      >
                        {outputIsPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                      </button>
                      
                      <div className="flex flex-col">
                        <span className="text-xs font-mono uppercase tracking-wider text-neutral-800 font-semibold">Voice Output</span>
                        <span className="text-xs font-mono text-neutral-500">
                          {formatTime(outputTime)} / {formatTime(outputDuration)}
                        </span>
                      </div>
                    </div>

                    <a 
                      href={audioUrl} 
                      download="hybrid_voice_output.wav"
                      className="flex items-center justify-center gap-2 border border-neutral-250 hover:border-neutral-350 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-mono uppercase tracking-wider px-3.5 py-2.5 rounded-sm transition-all shadow-sm font-semibold"
                    >
                      <Download size={12} />
                      Download
                    </a>
                  </div>
                </motion.div>
              ) : (
                /* Empty state */
                <div className="text-center text-neutral-400 py-6 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border border-dashed border-neutral-205 flex items-center justify-center mb-3">
                    <VolumePlaceholderIcon />
                  </div>
                  <p className="text-xs font-mono uppercase tracking-[0.15em] text-neutral-500">Awaiting Signal</p>
                  <p className="text-[11px] text-neutral-500 mt-1 max-w-[180px] font-light">Input transcript and source parameters to compile.</p>
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-[#E6E4DF] bg-[#FCFAF7] text-center text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
        <p>NEUROVOX
- AI Voice Fusion Platform</p>
      </footer>

    </div>
  );
}

// Simple icons inline for minimalism
function VolumePlaceholderIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="14" 
      height="14" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
  );
}
