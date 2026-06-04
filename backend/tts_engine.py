import os
os.environ["COQUI_TOS_AGREED"] = "1"
os.environ["TTS_AGREED"] = "1"
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
        print("MODEL STEP A: Starting model load")

        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"MODEL STEP B: Device = {device}")

        _tts_model = TTS(model_name=MODEL_NAME).to(device)

        print("MODEL STEP C: Model loaded")

    return _tts_model


def generate_blended_audio(
    text: str,
    voice1_path: Path,
    voice2_path: Path,
    ratio: int,
    language: str,
    output_path: Path
):
    print("STEP 1: Entered generate_blended_audio")

    print("STEP 2: About to load model")
    tts = get_tts_model()
    print("STEP 3: Model loaded successfully")

    v1_count = max(1, round(ratio / 10))
    v2_count = max(1, round((100 - ratio) / 10))

    speaker_mix = []
    for _ in range(v1_count):
        speaker_mix.append(str(voice1_path))
    for _ in range(v2_count):
        speaker_mix.append(str(voice2_path))

    print(f"[TTS Engine] Speaker mix ratio: {v1_count}:{v2_count}")

    print("STEP 4: About to call tts_to_file")

    tts.tts_to_file(
        text=text,
        speaker_wav=speaker_mix,
        language=language,
        file_path=str(output_path),
        temperature=0.7,
        repetition_penalty=2.0,
        top_k=50,
        top_p=0.85,
    )

    print("STEP 5: tts_to_file completed")

    return output_path
