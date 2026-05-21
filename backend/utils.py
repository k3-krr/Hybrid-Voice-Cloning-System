import os
from pathlib import Path
import noisereduce as nr
from scipy.io import wavfile
import shutil
from pydub import AudioSegment

# Configure pydub to use the local FFmpeg binary
ffmpeg_path = Path(__file__).parent / "ffmpeg_bin" / "ffmpeg.exe"
ffprobe_path = Path(__file__).parent / "ffmpeg_bin" / "ffprobe.exe"

if ffmpeg_path.exists():
    AudioSegment.converter = str(ffmpeg_path)
if ffprobe_path.exists():
    AudioSegment.ffprobe = str(ffprobe_path)

def setup_temp_dirs(base_dir: Path):
    temp_dir = base_dir / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    return temp_dir

def save_upload_file(upload_file, target_path: Path):
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

def ensure_wav(input_path: Path, output_path: Path, target_sr=22050):
    try:
        audio = AudioSegment.from_file(str(input_path))
        # Set channels to 1 (mono) and sample rate
        audio = audio.set_channels(1).set_frame_rate(target_sr)
        audio.export(str(output_path), format="wav")
        return True
    except Exception as e:
        print(f"Format conversion failed: {e}")
        return False

def apply_noise_reduction(input_path: Path, output_path: Path):
    try:
        # Load audio data
        rate, data = wavfile.read(input_path)
        # Perform noise reduction
        reduced_noise = nr.reduce_noise(y=data, sr=rate)
        # Save output
        wavfile.write(output_path, rate, reduced_noise)
        return True
    except Exception as e:
        print(f"Noise reduction failed: {e}")
        # If noise reduction fails (e.g. format issues), just copy the file
        shutil.copyfile(input_path, output_path)
        return False
