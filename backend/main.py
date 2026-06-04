from fastapi import FastAPI, UploadFile, Form, File, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uuid
import os
import traceback
from utils import setup_temp_dirs, save_upload_file, apply_noise_reduction, ensure_wav
from tts_engine import generate_blended_audio, get_tts_model

app = FastAPI(title="Voice Cloning API")

# Setup CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
TEMP_DIR = setup_temp_dirs(BASE_DIR)
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

@app.on_event("startup")
async def startup_event():
    # Pre-load model on startup to save time during requests
    # get_tts_model() 
    # Skipping auto-load on startup for faster server boot, 
    # but uncomment above if you want it loaded immediately
    pass

@app.post("/api/generate")
async def generate_voice(
    background_tasks: BackgroundTasks,
    text: str = Form(...),
    ratio: int = Form(50),
    language: str = Form("en"),
    noise_reduction: bool = Form(False),
    voice1: UploadFile = File(...),
    voice2: UploadFile = File(...)
):
    try:
        # Generate unique IDs for this request
        req_id = str(uuid.uuid4())[:8]
        v1_raw_path = TEMP_DIR / f"raw_v1_{req_id}_{voice1.filename}"
        v2_raw_path = TEMP_DIR / f"raw_v2_{req_id}_{voice2.filename}"
        
        v1_wav_path = TEMP_DIR / f"v1_{req_id}.wav"
        v2_wav_path = TEMP_DIR / f"v2_{req_id}.wav"
        
        output_filename = f"output_{req_id}.wav"
        output_path = OUTPUT_DIR / output_filename
        
        # Save uploads
        save_upload_file(voice1, v1_raw_path)
        save_upload_file(voice2, v2_raw_path)
        
        # Convert to standardized WAV (22050Hz)
        if not ensure_wav(v1_raw_path, v1_wav_path):
            raise Exception("Failed to process Voice 1 format. Ensure ffmpeg is installed and format is supported.")
        if not ensure_wav(v2_raw_path, v2_wav_path):
            raise Exception("Failed to process Voice 2 format. Ensure ffmpeg is installed and format is supported.")
        
        v1_path, v2_path = v1_wav_path, v2_wav_path
        
        # Apply noise reduction if requested
        if noise_reduction:
            v1_clean = TEMP_DIR / f"clean_{v1_path.name}"
            v2_clean = TEMP_DIR / f"clean_{v2_path.name}"
            apply_noise_reduction(v1_path, v1_clean)
            apply_noise_reduction(v2_path, v2_clean)
            v1_path, v2_path = v1_clean, v2_clean
            
        # Generate audio
        generate_blended_audio(
            text=text,
            voice1_path=v1_path,
            voice2_path=v2_path,
            ratio=ratio,
            language=language,
            output_path=output_path
        )
        
        # Cleanup temp files (can be done in background)
        def cleanup():
            try:
                for p in [v1_raw_path, v2_raw_path, v1_path, v2_path]:
                    if p.exists():
                        os.remove(p)
                if noise_reduction:
                    if 'v1_clean' in locals() and v1_clean.exists(): os.remove(v1_clean)
                    if 'v2_clean' in locals() and v2_clean.exists(): os.remove(v2_clean)
            except Exception as e:
                print(f"Cleanup error: {e}")
                
        background_tasks.add_task(cleanup)
        
        return {"status": "success", "audio_url": f"/api/audio/{output_filename}"}


    except Exception as e:
        print("FULL ERROR:")
        traceback.print_exc()

        return JSONResponse(status_code=500,content={"status": "error","message": str(e),"type": str(type(e))}
    )

@app.get("/api/audio/{filename}")
async def get_audio(filename: str):
    file_path = OUTPUT_DIR / filename
    if file_path.exists():
        return FileResponse(file_path, media_type="audio/wav")
    return JSONResponse(status_code=404, content={"status": "error", "message": "File not found"})
