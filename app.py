import os
import gradio as gr
from pathlib import Path

# ==========================================
# 1. INITIALIZATION & SETUP
# ==========================================
print("Loading Coqui XTTS Model... (This takes a moment)")
from TTS.api import TTS
MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2"
tts = TTS(model_name=MODEL_NAME) # GPU is used automatically if available
print("Model loaded successfully.")

# ==========================================
# 2. UTILITY FUNCTIONS
# ==========================================
def trim_silence(audio_path):
    try:
        import librosa
        import soundfile as sf
        import numpy as np
        
        y, sr = librosa.load(audio_path, sr=None)
        
        # Split audio into non-silent intervals to remove leading, trailing, AND internal silence
        intervals = librosa.effects.split(y, top_db=30)
        
        if len(intervals) > 0:
            # Concatenate all non-silent chunks to completely eliminate internal gaps
            y_trimmed = np.concatenate([y[start:end] for start, end in intervals])
            sf.write(audio_path, y_trimmed, sr)
            print("Silence trimmed and internal gaps removed successfully.")
        else:
            print("Audio was completely silent.")
            
    except Exception as e:
        print(f"Note: Could not trim silence ({e})")

def update_label(blend_val):
    return f"<div style='text-align: center; font-size: 1.1rem; color: #a855f7; margin-top: 10px; font-weight: 600;'>Current Blend: {blend_val}% Voice A / {100 - blend_val}% Voice B</div>"

def set_blend(val):
    return val, update_label(val)

def set_text(text):
    return text

# ==========================================
# 3. CORE GENERATION LOGIC
# ==========================================
def generate_voice(text, voice1_file, voice2_file, blend_ratio, progress=gr.Progress()):
    if not text or not text.strip():
        raise gr.Error("Empty text input. Please enter some text to synthesize.")
        
    # Helper to force Gradio audio inputs into reliable filepaths
    def ensure_filepath(audio_input, temp_name):
        if audio_input is None:
            return None
        # If Gradio returns a filepath string directly
        if isinstance(audio_input, str):
            return audio_input
        # If Gradio returns a tuple (sample_rate, numpy_array) from microphone
        if isinstance(audio_input, tuple):
            try:
                import soundfile as sf
                sr, y = audio_input
                sf.write(temp_name, y, sr)
                return temp_name
            except Exception as e:
                print(f"Error saving tuple audio: {e}")
                return None
        return str(audio_input)

    v1_path = ensure_filepath(voice1_file, "temp_voice1.wav")
    v2_path = ensure_filepath(voice2_file, "temp_voice2.wav")

    if not v1_path or not v2_path:
        raise gr.Error("Missing voice input files. Please upload or record both Voice A and Voice B.")

    output_file = "hybrid_voice_output.wav"
    
    progress(0.1, desc="Reading Voice A & B...")
    num_a = round((blend_ratio / 100) * 4)
    num_b = 4 - num_a
    
    progress(0.3, desc="Blending voice profiles...")
    speaker_mix = []
    if num_a > 0:
        speaker_mix.extend([v1_path] * num_a)
    if num_b > 0:
        speaker_mix.extend([v2_path] * num_b)

    progress(0.5, desc="Generating speech... (This may take a moment)")
    
    try:
        tts.tts_to_file(
            text=text,
            speaker_wav=speaker_mix,
            language="en",
            file_path=output_file,
            
            # 🔥 OPTIMIZED DECODING PARAMS TO PREVENT STRETCHING
            split_sentences=False,    
            temperature=0.6,          # Lower temp prevents hallucinating extra duration
            length_penalty=0.8,       # <1.0 forces shorter, more natural timing
            repetition_penalty=10.0,  # 10.0 is the standard XTTS default to stop looping/stutters
            top_k=50,
            top_p=0.8,
            num_beams=1               # Greedy decoding (1 beam) is fastest and prevents beam-search loops
        )
        
        progress(0.9, desc="Finalizing audio...")
        trim_silence(output_file)
        
        if os.path.exists(output_file):
            status_msg = f"✅ Done successfully! Blend: {blend_ratio}% A / {100 - blend_ratio}% B"
            progress(1.0, desc="Done successfully!")
            return status_msg, output_file, gr.update(value=output_file, visible=True)
        else:
            raise gr.Error("Generation failed. Output file was not created.")
            
    except Exception as e:
        error_msg = str(e)
        if "audio" in error_msg.lower() and "short" in error_msg.lower():
            raise gr.Error("Audio is too short. Please provide at least 3 seconds of reference audio.")
        else:
            raise gr.Error("Generation failed: Please check your audio files and retry.")

# ==========================================
# 4. PREMIUM UI DESIGN (CSS & LAYOUT)
# ==========================================
custom_css = """
/* Reset & Dark Theme Background */
body, .gradio-container {
    background-color: #050816 !important;
    color: #ffffff !important;
    font-family: 'Inter', system-ui, sans-serif !important;
}

/* 1. Premium Hero Section */
.hero-container {
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(147, 51, 234, 0.05) 100%);
    border: 1px solid rgba(147, 51, 234, 0.2);
    border-radius: 24px;
    padding: 3rem 2rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    margin-bottom: 2rem;
    box-shadow: 0 0 40px rgba(147, 51, 234, 0.1);
}
.hero-container::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(147,51,234,0.1) 0%, transparent 50%);
    animation: rotate 20s linear infinite;
    pointer-events: none;
}
@keyframes rotate { 100% { transform: rotate(360deg); } }

.hero-title {
    font-size: 3rem;
    font-weight: 800;
    background: linear-gradient(to right, #fff, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
}
.hero-subtitle {
    font-size: 1.2rem;
    color: #94a3b8;
    font-weight: 400;
}

/* 2. Glassmorphic Cards */
.glass-card {
    background: rgba(15, 23, 42, 0.6) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    border-radius: 20px !important;
    padding: 1.5rem !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
    transition: transform 0.3s ease, border-color 0.3s ease !important;
}
.glass-card:hover {
    border-color: rgba(147, 51, 234, 0.3) !important;
    transform: translateY(-2px) !important;
}

/* Section Titles */
.section-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.5rem;
}

/* 3. Premium Buttons */
.premium-btn {
    background: linear-gradient(90deg, #4f46e5, #7e22ce) !important;
    border: none !important;
    color: white !important;
    border-radius: 12px !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 15px rgba(126, 34, 206, 0.3) !important;
}
.premium-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(126, 34, 206, 0.5) !important;
    filter: brightness(1.1) !important;
}

/* Generate Button with Pulsing Glow */
.generate-btn {
    background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6) !important;
    background-size: 200% auto !important;
    color: white !important;
    font-size: 1.2rem !important;
    font-weight: bold !important;
    border: none !important;
    border-radius: 16px !important;
    padding: 1rem !important;
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.4) !important;
    animation: pulseGlow 2s infinite, shimmer 3s linear infinite !important;
    transition: all 0.3s ease !important;
}
.generate-btn:hover {
    transform: scale(1.02) !important;
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.7) !important;
}

@keyframes pulseGlow {
    0% { box-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }
    50% { box-shadow: 0 0 25px rgba(139, 92, 246, 0.7); }
    100% { box-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }
}
@keyframes shimmer {
    to { background-position: 200% center; }
}

/* Fix Input Backgrounds to match Dark Theme */
.gr-input, .gr-box, .gr-form {
    background-color: rgba(30, 41, 59, 0.4) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
}
"""

# Force dark mode entirely
custom_theme = gr.themes.Base(
    primary_hue="purple",
    neutral_hue="slate"
)

with gr.Blocks(title="NeuroVox: AI Voice Cloning", theme=custom_theme, css=custom_css) as demo:
    
    # Hero Section
    gr.HTML('''
    <div class="hero-container">
        <div style="font-size: 4rem; margin-bottom: 1rem; filter: drop-shadow(0 0 10px rgba(168,85,247,0.8));">🎙️</div>
        <div class="hero-title">NeuroVox Studio</div>
        <div class="hero-subtitle">Create a new voice by blending two identities with AI.</div>
    </div>
    ''')
    
    with gr.Row():
        # LEFT COLUMN: Inputs
        with gr.Column(scale=5):
            
            # CARD 1: Text Input
            with gr.Column(elem_classes="glass-card"):
                gr.HTML('<div class="section-title">✨ 1. Enter Text</div>')
                text_input = gr.Textbox(
                    show_label=False,
                    lines=3, 
                    placeholder="Type what you want the AI to say..."
                )
                
                gr.Markdown("<span style='color: #94a3b8; font-size: 0.9rem;'>Try a sample phrase:</span>")
                with gr.Row():
                    btn_sample1 = gr.Button("Welcome to the future.", size="sm", elem_classes="premium-btn")
                    btn_sample2 = gr.Button("This is a hybrid demo.", size="sm", elem_classes="premium-btn")
                    btn_sample3 = gr.Button("Hello Rithya, it works.", size="sm", elem_classes="premium-btn")
                    btn_sample4 = gr.Button("AI voice is live.", size="sm", elem_classes="premium-btn")
                    
                    btn_sample1.click(fn=lambda: set_text("Welcome to the future."), outputs=text_input)
                    btn_sample2.click(fn=lambda: set_text("This is a hybrid voice demo."), outputs=text_input)
                    btn_sample3.click(fn=lambda: set_text("Hello Rithya, your project works."), outputs=text_input)
                    btn_sample4.click(fn=lambda: set_text("AI voice cloning is now live."), outputs=text_input)

            gr.HTML("<div style='height: 1rem;'></div>") # Spacer
            
            # CARD 2: Voice Upload
            with gr.Column(elem_classes="glass-card"):
                gr.HTML('<div class="section-title">🎙️ 2. Upload or Record Voices</div>')
                with gr.Row():
                    voice1 = gr.Audio(label="Voice A", sources=["upload", "microphone"], type="filepath")
                    voice2 = gr.Audio(label="Voice B", sources=["upload", "microphone"], type="filepath")
            
            gr.HTML("<div style='height: 1rem;'></div>") # Spacer
            
            # CARD 3: Blend Settings
            with gr.Column(elem_classes="glass-card"):
                gr.HTML('<div class="section-title">🎚️ 3. Blend Ratio</div>')
                
                with gr.Row():
                    btn_preset1 = gr.Button("Voice A Dominant (80/20)", size="sm", elem_classes="premium-btn")
                    btn_preset2 = gr.Button("Balanced (50/50)", size="sm", elem_classes="premium-btn")
                    btn_preset3 = gr.Button("Voice B Dominant (20/80)", size="sm", elem_classes="premium-btn")
                    btn_preset4 = gr.Button("Cinematic Blend (60/40)", size="sm", elem_classes="premium-btn")
                
                blend_slider = gr.Slider(minimum=0, maximum=100, value=50, step=1, label="Voice A Influence (%)")
                blend_label = gr.HTML(update_label(50))
                
                blend_slider.change(fn=update_label, inputs=blend_slider, outputs=blend_label)
                btn_preset1.click(fn=lambda: set_blend(80), outputs=[blend_slider, blend_label])
                btn_preset2.click(fn=lambda: set_blend(50), outputs=[blend_slider, blend_label])
                btn_preset3.click(fn=lambda: set_blend(20), outputs=[blend_slider, blend_label])
                btn_preset4.click(fn=lambda: set_blend(60), outputs=[blend_slider, blend_label])
            
        # RIGHT COLUMN: Outputs
        with gr.Column(scale=4):
            # CARD 4: Generation Output
            with gr.Column(elem_classes="glass-card"):
                gr.HTML('<div class="section-title">🚀 4. Generation Studio</div>')
                
                generate_btn = gr.Button("✨ Generate Hybrid Voice", elem_classes="generate-btn")
                
                gr.HTML("<div style='height: 1rem;'></div>") # Spacer
                
                status_text = gr.Textbox(label="System Status", interactive=False, value="Ready to generate.")
                output_audio = gr.Audio(label="Final Hybrid Output")
                
                download_btn = gr.DownloadButton("💾 Download Audio (.wav)", visible=False, elem_classes="premium-btn")

    # Connect main generation function
    generate_btn.click(
        fn=generate_voice,
        inputs=[text_input, voice1, voice2, blend_slider],
        outputs=[status_text, output_audio, download_btn]
    )

if __name__ == "__main__":
    demo.launch()
