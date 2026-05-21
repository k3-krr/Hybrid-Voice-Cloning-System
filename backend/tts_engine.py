import os
import torch
from pathlib import Path
from TTS.api import TTS

# Global model variable to ensure it's loaded only once (Singleton pattern)
_tts_model = None

# Coqui multilingual multi-speaker model (XTTS v2).
MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2"

def get_tts_model():
    global _tts_model
    if _tts_model is None:
        print("[TTS Engine] Loading Coqui TTS model... (This may take a while on CPU)")
        # If no GPU, it will fallback to CPU. But let's be explicit if needed.
        # We check torch.cuda.is_available() but user said CPU only.
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _tts_model = TTS(model_name=MODEL_NAME).to(device)
        print(f"[TTS Engine] Model loaded on {device}.")
    return _tts_model

def generate_blended_audio(
    text: str,
    voice1_path: Path,
    voice2_path: Path,
    ratio: int,
    language: str,
    output_path: Path
):
    """
    Generate audio blending two voices based on the ratio.
    ratio: 0-100 (e.g. 70 means 70% voice1, 30% voice2)
    """
    tts = get_tts_model()
    
    # Calculate how many times to include each voice in the speaker_wav list
    # We use a scale of 10 to keep the list reasonably sized
    v1_count = max(1, round(ratio / 10))
    v2_count = max(1, round((100 - ratio) / 10))
    
    speaker_mix = []
    for _ in range(v1_count):
        speaker_mix.append(str(voice1_path))
    for _ in range(v2_count):
        speaker_mix.append(str(voice2_path))
        
    print(f"[TTS Engine] Speaker mix ratio: {v1_count}:{v2_count} -> {len(speaker_mix)} conditioning files")

    # For CPU optimization, we keep beam search simple
    tts.tts_to_file(
        text=text,
        speaker_wav=speaker_mix,
        language=language,
        file_path=str(output_path),
        # CPU optimized settings (lower beams, standard temp)
        temperature=0.7,
        repetition_penalty=2.0,
        top_k=50,
        top_p=0.85,
        # CPU speedup: use lower beams or none
        # num_beams=1,
    )
    return output_path
