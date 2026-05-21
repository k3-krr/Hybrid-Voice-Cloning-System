"""
Voice Cloning / Hybrid Voice Generation (Beginner-Friendly)
-----------------------------------------------------------
Pipeline overview:
1) Embedding:
   The model reads each reference speaker audio file and extracts speaker embeddings
   (compact numeric voice fingerprints).
2) Blending:
   When multiple reference files are provided, the model internally combines their
   speaker characteristics into a blended speaker condition.
3) Generation:
   The model converts your input text into speech, guided by the blended speaker
   condition, then saves the final waveform to output.wav.
"""

from pathlib import Path
import sys

from TTS.api import TTS


# =========================
# Easy-to-edit user settings
# =========================
# Change this text anytime to generate different speech content.

BASE_DIR = Path(__file__).parent
input_file = BASE_DIR / "input.txt"

try:
    with open(input_file, "r", encoding="utf-8") as f:
        TEXT_TO_SPEAK = f.read().strip()
except:
    TEXT_TO_SPEAK = "Default fallback text"
print("TEXT RECEIVED:", TEXT_TO_SPEAK)


# Input speaker reference files (WAV recommended).
VOICE_1_PATH = "voice1.wav"
VOICE_2_PATH = "voice2.wav"

# Output file path.
OUTPUT_PATH = "output.wav"

# Coqui multilingual multi-speaker model (XTTS v2).
MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2"

# Language for multilingual models. Examples: "en", "es", "fr", "de", etc.
LANGUAGE = "en"


def validate_audio_file(path: Path) -> None:
    """Validate that an audio file exists and has a supported extension."""
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    if not path.is_file():
        raise ValueError(f"Not a file: {path}")

    # Keep validation simple and beginner-friendly.
    allowed_ext = {".wav", ".mp3", ".flac", ".m4a", ".ogg"}
    if path.suffix.lower() not in allowed_ext:
        raise ValueError(
            f"Unsupported audio format for '{path.name}'. "
            f"Use one of: {', '.join(sorted(allowed_ext))}"
        )


def main() -> None:
    """Run hybrid voice generation using two speaker reference audios."""
    print("[1/5] Preparing paths and validating inputs...")
    speaker_wavs = [Path(VOICE_1_PATH), Path(VOICE_2_PATH)]
    output_file = Path(OUTPUT_PATH)

    if not TEXT_TO_SPEAK.strip():
        raise ValueError("Input text is empty. Please set TEXT_TO_SPEAK.")

    for wav in speaker_wavs:
        validate_audio_file(wav)
        print(f"      OK: {wav}")

    print("[2/5] Loading Coqui TTS model...")
    # GPU is used automatically if available; otherwise CPU.
    tts = TTS(model_name=MODEL_NAME)
    print("      Model loaded successfully.")

    print("[3/5] Generating speech with blended speaker references...")
    
    # --- BLEND RATIO LOGIC ---
    # Read the blend ratio from blend.txt (default to 50 if missing)
    blend_file = BASE_DIR / "blend.txt"
    try:
        with open(blend_file, "r") as f:
            blend_ratio = int(f.read().strip())
    except Exception:
        blend_ratio = 50  # Default to 50/50 blend
        
    # Calculate how many times to repeat Voice A and Voice B (out of 4 total elements for speed)
    # Example: 70% A / 30% B -> 3 times A, 1 time B
    num_a = round((blend_ratio / 100) * 4)
    num_b = 4 - num_a
    
    # Create the weighted list of speaker references
    speaker_mix = []
    if num_a > 0:
        speaker_mix.extend([str(speaker_wavs[0])] * num_a)
    if num_b > 0:
        speaker_mix.extend([str(speaker_wavs[1])] * num_b)
        
    print(f"      Blend Ratio: {blend_ratio}% Voice A / {100-blend_ratio}% Voice B")
    print(f"      Speaker Mix contains {num_a}x Voice A and {num_b}x Voice B (Max 4)")
    # -------------------------
    # Important: passing a list enables multi-reference speaker conditioning.
    tts.tts_to_file(
    text=TEXT_TO_SPEAK,
    speaker_wav=speaker_mix,
    language=LANGUAGE,
    file_path=str(output_file),

    # 🔥 SMOOTHNESS TUNING
    temperature=0.8,
    repetition_penalty=2.5,
    top_k=50,
    top_p=0.85,
    num_beams=3,
    length_penalty=1.1
    )

    print("[4/6] Trimming silence from output...")
    try:
        import librosa
        import soundfile as sf
        y, sr = librosa.load(output_file, sr=None)
        # Trim leading and trailing silence (top_db=30 is a standard threshold for speech)
        y_trimmed, _ = librosa.effects.trim(y, top_db=30)
        sf.write(output_file, y_trimmed, sr)
        print("      Silence trimmed successfully.")
    except Exception as e:
        print(f"      Note: Could not trim silence ({e})")

    print("[5/6] Verifying output...")
    if not output_file.exists() or output_file.stat().st_size == 0:
        raise RuntimeError("Generation finished but output file is missing or empty.")

    print("[6/6] Done.")
    print(f"      Output saved to: {output_file.resolve()}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("\nERROR: Voice generation failed.")
        print(f"Reason: {exc}")
        print(
            "\nTips:\n"
            "- Install dependencies: pip install TTS torch torchaudio\n"
            "- Ensure voice1.wav and voice2.wav exist in this folder\n"
            "- Use valid audio formats and a supported language code"
        )
        sys.exit(1)
