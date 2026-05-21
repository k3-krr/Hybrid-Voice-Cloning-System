"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Settings, Download, Play, AlertCircle } from "lucide-react";
import AudioInputCard from "@/components/AudioInputCard";
import BlendSlider from "@/components/Slider";

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

      // Replace with your actual backend URL if running on a different port
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

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 relative">
      {/* Decorative background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <main className="max-w-5xl mx-auto relative z-10">
        <header className="mb-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent"
          >
            AI Voice Synthesis
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            Blend two distinct voices into a perfect hybrid, and bring any text to life with studio-quality generation.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <AudioInputCard title="Source Voice 1" onFileChange={setVoice1} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <AudioInputCard title="Source Voice 2" onFileChange={setVoice2} />
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-2xl p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold tracking-tight">Speech Content</h3>
          </div>
          <textarea
            className="w-full bg-surface border border-border rounded-xl p-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all min-h-[120px] resize-y"
            placeholder="Type exactly what you want the blended voice to say..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        >
          <div className="glass-panel rounded-2xl p-6 md:col-span-2">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Settings size={16} /> Blend Settings
            </h3>
            <BlendSlider value={ratio} onChange={setRatio} />
          </div>

          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Language</label>
              <select 
                className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English (US)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer group mt-2">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={noiseReduction}
                  onChange={(e) => setNoiseReduction(e.target.checked)}
                />
                <div className={`w-10 h-5 bg-surface border border-border rounded-full transition-colors ${noiseReduction ? 'bg-primary/50 border-primary' : ''}`}></div>
                <div className={`absolute left-1 w-3 h-3 bg-white rounded-full transition-transform ${noiseReduction ? 'translate-x-5' : ''}`}></div>
              </div>
              <span className="text-sm text-white/80 group-hover:text-white transition-colors">Reduce Noise (Slower)</span>
            </label>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center justify-center gap-6"
        >
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-4 rounded-xl w-full max-w-2xl"
              >
                <AlertCircle size={20} />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !voice1 || !voice2 || !text.trim()}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-primary font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover w-full max-w-md overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none"></div>
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={20} />
                <span>Synthesizing Voice...</span>
              </div>
            ) : (
              <span>Generate Blended Voice</span>
            )}
          </button>

          <AnimatePresence>
            {audioUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-2xl p-6 w-full max-w-2xl mt-4 flex flex-col md:flex-row items-center gap-6"
              >
                <div className="flex-grow w-full">
                  <p className="text-sm font-medium text-white/80 mb-2">Generation Complete</p>
                  <audio controls className="w-full rounded-lg" src={audioUrl}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
                <a 
                  href={audioUrl} 
                  download="blended_voice.wav"
                  className="flex items-center gap-2 bg-surface hover:bg-white/10 border border-border px-4 py-3 rounded-xl transition-colors shrink-0 text-sm font-medium"
                >
                  <Download size={18} />
                  Download WAV
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
