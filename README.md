# AI Voice Cloning & Blending App

🚀 Live Demo Video:

👉 [https://youtube.com/your-video-link](https://youtu.be/UvYBnrg84mM)

A full-stack application that allows you to clone and blend two distinct voices into a perfect hybrid, then synthesize any speech from text using the Coqui XTTS v2 model. 

## Features
- **Dual Voice Input**: Upload or record two reference voices right from the browser.
- **Voice Blending Ratio**: Custom slider to control the hybrid output (e.g., 70% Voice 1 / 30% Voice 2).
- **Multi-Language Support**: Synthesize speech in English, Spanish, French, German, Italian, and Portuguese.
- **Premium UI**: Modern dark theme with glassmorphism and beautiful micro-animations using Next.js, Tailwind CSS v4, and Framer Motion.
- **Noise Reduction**: Optional backend preprocessing to clean up uploaded/recorded audio for better quality.
- **CPU Optimized**: Uses a streamlined generation pipeline suitable for running on machines without a dedicated NVIDIA GPU.

---
## Screenshots

### Landing Page
<img width="100%" src="https://github.com/user-attachments/assets/26027722-2a64-42b2-b982-2e69bfba12e6" />

### Voice Studio
<img width="100%" src="https://github.com/user-attachments/assets/a029c4d5-e3e3-47c7-8eb6-15f6de10ccd3" />

### Generation Interface
<img width="100%" src="https://github.com/user-attachments/assets/8b91414f-8b7c-47e6-a8aa-97760b00936f" />

### Output Preview
<img width="100%" src="https://github.com/user-attachments/assets/205541ef-911f-4f75-9784-4e01b3f19357" />

## Folder Structure
- `/frontend`: Next.js React application (UI/UX).
- `/backend`: FastAPI Python server (Inference & Audio Processing).

---

## 🚀 Setup & Run Instructions

### 1. Backend (Python/FastAPI)

Requires **Python 3.10+**.

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Activate your virtual environment (or create a new one):
   ```bash
   # If using your existing venv from the parent folder:
   ..\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *Note: The first time you generate audio, the Coqui TTS model will download its weights (~2GB). Subsequent runs will load locally.*

### 2. Frontend (Next.js)

Requires **Node.js (LTS)**.

1. Open a **new** terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

### 3. Usage

1. Open your browser to [http://localhost:3000](http://localhost:3000).
2. Upload or record two voice samples (10-30 seconds of clear speech works best).
3. Type the text you want the AI to speak.
4. Adjust the blend ratio and language.
5. Click **Generate Blended Voice**.

---

## Troubleshooting
- **Microphone not working**: Ensure your browser has permission to access the microphone.
- **Backend errors**: Ensure `ffmpeg` is installed on your system if you encounter audio format conversion errors.
- **Slow Generation**: The `Reduce Noise` feature takes extra CPU time. Generating long text on a CPU takes time. Be patient!
