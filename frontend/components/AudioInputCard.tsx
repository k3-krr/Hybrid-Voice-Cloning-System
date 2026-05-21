"use client";

import React, { useState, useRef } from "react";
import { Mic, Upload, X, Play, Square, FileAudio } from "lucide-react";
import { motion } from "framer-motion";

interface AudioInputCardProps {
  title: string;
  onFileChange: (file: File | null) => void;
}

export default function AudioInputCard({ title, onFileChange }: AudioInputCardProps) {
  const [mode, setMode] = useState<"upload" | "record">("upload");
  const [file, setFile] = useState<File | null>(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        
        // Stop all tracks to release mic
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
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full relative overflow-hidden group">
      {/* subtle animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <div className="flex bg-surface rounded-lg p-1 border border-border">
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === "upload" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}
            onClick={() => { setMode("upload"); if (!file) setFile(null); }}
          >
            Upload
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === "record" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}
            onClick={() => { setMode("record"); if (!file) setFile(null); }}
          >
            Record
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-center relative z-10">
        {file ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-xl p-4 flex items-center justify-between border border-border"
          >
            <div className="flex items-center gap-3 truncate">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <FileAudio size={20} />
              </div>
              <div className="truncate">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-white/50">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button onClick={removeFile} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
              <X size={18} />
            </button>
          </motion.div>
        ) : mode === "upload" ? (
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors">
            <Upload className="mb-3 text-white/40" size={32} />
            <p className="text-sm font-medium mb-1">Click to upload or drag & drop</p>
            <p className="text-xs text-white/50 mb-4">WAV, MP3, FLAC up to 10MB</p>
            <label className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors border border-border">
              Select Audio
              <input type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-3xl font-mono mb-6 text-white/80">
              {formatTime(recordingTime)}
            </div>
            {isRecording ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={stopRecording}
                className="bg-red-500/20 text-red-500 border border-red-500/50 rounded-full p-6 animate-pulse hover:bg-red-500/30 transition-colors"
              >
                <Square size={24} fill="currentColor" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="bg-primary/20 text-primary border border-primary/50 rounded-full p-6 hover:bg-primary/30 transition-colors"
              >
                <Mic size={24} />
              </motion.button>
            )}
            <p className="text-xs text-white/50 mt-4">
              {isRecording ? "Recording in progress..." : "Click to start recording"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
