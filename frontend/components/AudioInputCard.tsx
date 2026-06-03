"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Upload, X, Play, Pause, Square, FileAudio, CheckCircle2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AudioInputCardProps {
  title: string;
  onFileChange: (file: File | null) => void;
}

export default function AudioInputCard({ title, onFileChange }: AudioInputCardProps) {
  const [mode, setMode] = useState<"upload" | "record">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  
  // Waveform visualization data
  const [waveform, setWaveform] = useState<number[]>([]);
  
  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse audio file details when it changes
  useEffect(() => {
    if (!file) {
      setDuration(null);
      setWaveform([]);
      setIsPlaying(false);
      setPlaybackTime(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    // Initialize HTMLAudioElement for playback and duration check
    const audioUrl = URL.createObjectURL(file);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setPlaybackTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    // Decode actual waveform using Web Audio API
    const decodeAudioWaveform = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const context = new AudioContextClass();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        const rawData = audioBuffer.getChannelData(0);
        
        const samples = 35; // numbers of bars
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }

        const maxVal = Math.max(...filteredData);
        const normalizedData = filteredData.map(val => (maxVal > 0 ? val / maxVal : 0.15));
        setWaveform(normalizedData);
        context.close();
      } catch (err) {
        console.error("Web Audio API decoding failed, using mock waveform", err);
        const mockWave = Array.from({ length: 35 }).map(() => 0.15 + Math.random() * 0.7);
        setWaveform(mockWave);
      }
    };

    decodeAudioWaveform();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      URL.revokeObjectURL(audioUrl);
    };
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      onFileChange(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    onFileChange(null);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error("Playback error", e));
      setIsPlaying(true);
    }
  };

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Recording functionality
  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  };

  const startRecording = async () => {
    try {
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        alert("Your browser does not support audio recording.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("ogg") ? "ogg" : "wav";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const generatedFile = new File([audioBlob], `recording-${Date.now()}.${ext}`, { type: mimeType });
        setFile(generatedFile);
        onFileChange(generatedFile);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Microphone access was denied. Please allow microphone permissions in your browser settings to record audio.");
      } else {
        alert("Could not access microphone. Please check your device.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="border border-border rounded-lg p-6 bg-surface flex flex-col h-full relative overflow-hidden transition-all duration-300">
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-base md:text-lg font-medium tracking-tight text-neutral-800 font-serif">{title}</h3>
        
        {/* Toggle selectors (only show if not loaded) */}
        {!file && (
          <div className="flex bg-[#f5f3ef] rounded-lg p-0.5 border border-border">
            <button
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${mode === "upload" ? "bg-white text-neutral-800 shadow-sm border border-neutral-200/40" : "text-neutral-500 hover:text-neutral-800 font-medium"}`}
              onClick={() => setMode("upload")}
            >
              Upload
            </button>
            <button
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${mode === "record" ? "bg-white text-neutral-800 shadow-sm border border-neutral-200/40" : "text-neutral-500 hover:text-neutral-800 font-medium"}`}
              onClick={() => setMode("record")}
            >
              Record
            </button>
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col justify-center relative z-10">
        {file ? (
          /* Active Loaded State (ElevenLabs-style) */
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium text-neutral-800">Reference voice loaded</span>
              </div>
              <span className="text-sm font-mono text-neutral-600">
                {duration ? formatTime(duration) : "--:--"}
              </span>
            </div>

            {/* Visual Waveform Panel */}
            <div className="relative h-16 bg-[#faf8f3] rounded-lg flex items-center justify-center px-4 border border-neutral-200/60 overflow-hidden">
              {/* Playback Progress Overlay */}
              {duration && (
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-100 ease-linear pointer-events-none"
                  style={{ width: `${(playbackTime / duration) * 100}%` }}
                />
              )}
              
              {/* Actual Waveform Visualization */}
              <div className="flex items-center justify-between w-full h-10 gap-[2px]">
                {waveform.map((heightMultiplier, idx) => {
                  const barProgressFraction = idx / waveform.length;
                  const currentProgressFraction = duration ? (playbackTime / duration) : 0;
                  const isPlayed = barProgressFraction <= currentProgressFraction;
                  
                  return (
                    <div
                      key={idx}
                      className={`w-[3px] rounded-full transition-colors duration-150 ${
                        isPlayed ? "bg-primary" : "bg-neutral-300/80"
                      }`}
                      style={{ height: `${Math.max(4, heightMultiplier * 100)}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={togglePlayback}
                className="flex items-center justify-center gap-2 bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-800 rounded-lg px-4 py-2.5 text-sm font-medium transition-all shadow-sm"
              >
                {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                {isPlaying ? "Pause Preview" : "Play Preview"}
              </button>

              <button
                onClick={removeFile}
                className="flex items-center justify-center gap-2 bg-transparent hover:bg-neutral-50 text-neutral-600 hover:text-neutral-800 rounded-lg px-3 py-2 text-sm font-medium transition-all border border-transparent hover:border-neutral-200/60 ml-auto"
              >
                <RotateCcw size={12} />
                Replace
              </button>
            </div>
          </motion.div>
        ) : mode === "upload" ? (
          /* Upload State */
          <div 
            onClick={triggerUpload}
            className="border border-dashed border-neutral-300 bg-[#fdfcfb] rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:bg-neutral-50"
          >
            <Upload className="mb-3 text-neutral-400 group-hover:text-primary transition-colors" size={24} />
            <p className="text-base font-medium text-neutral-800 mb-1">Click to upload voice file</p>
            <p className="text-sm text-neutral-500">WAV, MP3 or M4A up to 10MB</p>
            
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="audio/*" 
              onChange={handleFileChange} 
            />
          </div>
        ) : (
          /* Recording State */
          <div className="flex flex-col items-center justify-center py-2">
            <div className="text-2xl font-mono mb-4 text-neutral-800 tracking-widest">
              {formatTime(recordingTime)}
            </div>
            
            {isRecording ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={stopRecording}
                className="bg-red-50 text-red-600 border border-red-200 rounded-full p-4 animate-pulse hover:bg-red-100 transition-all"
              >
                <Square size={20} fill="currentColor" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="bg-primary/10 text-primary border border-primary/20 rounded-full p-4 hover:bg-primary/20 transition-all"
              >
                <Mic size={20} />
              </motion.button>
            )}
            
            <p className="text-sm text-neutral-500 mt-3 font-mono">
              {isRecording ? "Recording in progress..." : "Click microphone to record"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
