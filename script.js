document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const durationInput = document.getElementById('durationInput');
    const generateBtn = document.getElementById('generateBtn');
    const feedbackSection = document.getElementById('feedback');
    const fileListUl = document.getElementById('fileList');
    const durationDisplay = document.getElementById('durationDisplay');
    const outputSection = document.getElementById('output');
    const scriptOutputTextarea = document.getElementById('scriptOutput');
    const copyBtn = document.getElementById('copyBtn');
    const colabInstructionsSection = document.getElementById('colab-instructions');

    copyBtn.disabled = true; // Disable initially

    generateBtn.addEventListener('click', () => {
        const files = fileInput.files;
        const duration = parseInt(durationInput.value, 10);

        // --- Basic Validation ---
        if (files.length === 0) {
            alert('Please select at least one photo or video file.');
            return;
        }
        if (isNaN(duration) || duration <= 0) {
            alert('Please enter a valid positive number for the duration.');
            return;
        }
         if (files.length > 6) {
            // Optionally limit files based on grid size
             alert('Warning: This preset uses a 3x2 grid. Only the first 6 files will be used in the script.');
            // We'll still proceed but slice the array later
        }


        // --- Extract Filenames ---
        const fileNames = [];
        for (let i = 0; i < files.length; i++) {
            fileNames.push(files[i].name);
        }
        // Slice if more than 6 files were selected for the 3x2 grid preset
        const foregroundFileNames = fileNames.slice(0, 6);


        // --- Display Feedback ---
        fileListUl.innerHTML = ''; // Clear previous list
        foregroundFileNames.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            fileListUl.appendChild(li);
        });
        durationDisplay.textContent = duration;
        feedbackSection.classList.remove('hidden'); // Show feedback

        // --- Define Presets (Hardcoded) ---
        const WIDTH = 1280;
        const HEIGHT = 720;
        const FPS = 30;
        const GRID_COLS = 3;
        const GRID_ROWS = 2;
        const FRAME_THICKNESS = 8;
        const FRAME_COLOR_RGB = '(255, 255, 255)'; // As Python tuple string
        const BACKGROUND_COLOR_RGB = '(10, 10, 10)';
        const BG_BLUR_AMOUNT = 8;
        const BG_OPACITY = 0.15;
        const BG_DRIFT_SPEED = 15;
        const FG_DRIFT_SPEED = 5;
        const NARRATION_VOLUME = 1.0;
        const MUSIC_VOLUME = 0.15;
        const CHANNEL_TEXT = "WOW FACTS हिन्दी"; // Default text, or set to null
        const FONT_PATH = "DejaVu-Sans"; // Default Colab/Linux font

        // --- Generate Python Script ---
        // Use JSON.stringify to safely convert JS array to Python list string format
        const foregroundFilesPythonList = JSON.stringify(foregroundFileNames);

        // Placeholder for background files - assuming they exist in Colab or are handled differently
        // For simplicity, let's reuse foreground files for background, common in templates
        const backgroundFilesPythonList = JSON.stringify(foregroundFileNames); // Or define a fixed list if needed

        const pythonScript = `# === Generated Python Script for Google Colab ===

# --- Cell 1: Installation (Run this first) ---
!pip install moviepy
!apt install imagemagick -qq # Needed for TextClip, -qq for quieter install
!pip install --upgrade imageio-ffmpeg -q # Ensure latest ffmpeg bindings

# --- Cell 2: Main Video Generation Script ---
import os
import random
import numpy as np
from moviepy.editor import *
from moviepy.video.fx.all import * # Import effects like blur
print("MoviePy and dependencies installed/updated.")

# --- Configuration (Generated from Web App) ---
ASSET_FOLDER = "/content/" # Assumes files uploaded directly to Colab session storage
OUTPUT_FILENAME = "final_intro.mp4"
DURATION = ${duration}  # Total video duration in seconds
WIDTH = ${WIDTH}
HEIGHT = ${HEIGHT}
FPS = ${FPS}

# Foreground elements (ensure these files are uploaded to Colab with exact names)
foreground_files = ${foregroundFilesPythonList}

# Background elements (using foreground files here, upload these too)
# If you have separate background images, modify this list and upload them
background_files = ${backgroundFilesPythonList}

# Audio files (optional - upload if you want them)
narration_file = "narration.mp3"  # Expected filename if used
music_file = "background_music.mp3" # Expected filename if used

# Logo / Text
logo_file = None # e.g., "logo.png" - Upload if you want a logo image instead of text
channel_text = "${CHANNEL_TEXT}" # Or set to None to disable text
font_path = "${FONT_PATH}" # Check Colab compatibility or upload a TTF font

# Layout & Style Presets
GRID_COLS = ${GRID_COLS}
GRID_ROWS = ${GRID_ROWS}
FOREGROUND_ITEM_W = 250 # Width of each foreground item *including* frame
FOREGROUND_ITEM_H = 150 # Height of each foreground item *including* frame
FRAME_THICKNESS = ${FRAME_THICKNESS}
FRAME_COLOR = ${FRAME_COLOR_RGB} # White
BACKGROUND_COLOR = ${BACKGROUND_COLOR_RGB} # Dark grey/black

# Animation & Effect Presets
BG_BLUR_AMOUNT = ${BG_BLUR_AMOUNT}
BG_OPACITY = ${BG_OPACITY}
BG_DRIFT_SPEED = ${BG_DRIFT_SPEED} # Pixels per second (average)
FG_DRIFT_SPEED = ${FG_DRIFT_SPEED}  # Pixels per second (average)

# Audio Level Presets
NARRATION_VOLUME = ${NARRATION_VOLUME}
MUSIC_VOLUME = ${MUSIC_VOLUME}

# --- Helper Functions (Do Not Modify Usually) ---

def create_framed_clip(filepath, item_w, item_h, frame_thickness, frame_color, duration):
    """Creates a framed image or video clip."""
    core_w = item_w - 2 * frame_thickness
    core_h = item_h - 2 * frame_thickness

    try:
        # Check if it's a video or image file
        _, ext = os.path.splitext(filepath)
        if not os.path.exists(filepath):
             print(f"ERROR: File not found: {filepath}. Creating placeholder.")
             return ColorClip(size=(item_w, item_h), color=(50,0,0), duration=duration) # Red placeholder

        if ext.lower() in ['.mp4', '.mov', '.avi', '.webm', '.mkv']: # Video extensions
            clip_core = VideoFileClip(filepath, target_resolution=(core_h, None)).set_duration(duration) # Resize based on height first
            clip_core = clip_core.resize(width=core_w) # Then fit width
            clip_core = clip_core.without_audio() # Mute foreground video audio
            if clip_core.duration < duration:
               clip_core = clip_core.loop(duration=duration)
            clip_core = clip_core.set_fps(FPS) # Ensure consistent FPS

        else: # Assume image
            clip_core = ImageClip(filepath).set_duration(duration)
            clip_core = clip_core.resize(height=core_h) # Resize based on height
            clip_core = clip_core.resize(width=core_w) # Then fit width

        # Ensure exact size after potential aspect ratio adjustments
        clip_core = clip_core.resize(newsize=(core_w, core_h))

    except Exception as e:
        print(f"Error loading file: {filepath}. Creating placeholder. Error: {e}")
        return ColorClip(size=(item_w, item_h), color=(50,0,0), duration=duration) # Red placeholder

    frame_bg = ColorClip(size=(item_w, item_h), color=frame_color, duration=duration)
    framed_clip = CompositeVideoClip([frame_bg, clip_core.set_position('center')], size=(item_w, item_h))
    return framed_clip

def subtle_drift(clip, speed, duration):
    """Applies a slow random drift animation based on numeric position."""
    max_drift_x = speed * duration
    max_drift_y = speed * duration
    start_x_offset = random.uniform(-max_drift_x / 4, max_drift_x / 4)
    start_y_offset = random.uniform(-max_drift_y / 4, max_drift_y / 4)
    end_x_offset = random.uniform(-max_drift_x / 2, max_drift_x / 2)
    end_y_offset = random.uniform(-max_drift_y / 2, max_drift_y / 2)

    # Requires clip's position to be set numerically (x, y) beforehand
    original_pos = clip.pos

    def pos_func(t):
        progress = t / duration
        current_x_offset = start_x_offset + (end_x_offset - start_x_offset) * progress
        current_y_offset = start_y_offset + (end_y_offset - start_y_offset) * progress

        # Check if original_pos was set numerically
        if isinstance(original_pos, (tuple, list)) and len(original_pos) == 2 and isinstance(original_pos[0], (int, float)):
            base_x, base_y = original_pos
            return (base_x + current_x_offset, base_y + current_y_offset)
        else:
            # Fallback if position wasn't numeric (e.g., 'center'), just return original
            # print("Warning: subtle_drift requires numeric start position for clip.") # Optional warning
            return original_pos

    return clip.set_position(pos_func)

# --- Main Script Logic ---

print("Starting video creation process...")
all_clips = []

# 1. Base Background Color
print("1. Creating base background...")
base_bg = ColorClip(size=(WIDTH, HEIGHT), color=BACKGROUND_COLOR, duration=DURATION)
all_clips.append(base_bg)

# 2. Animated Background Elements
print("2. Creating animated background elements...")
bg_clip_size = (int(WIDTH * 0.15), int(HEIGHT * 0.15))
num_bg_elements = 25 # Adjust for density

if not background_files:
    print("   Skipping background elements (no files specified).")
else:
    for i in range(num_bg_elements):
        try:
            img_path_rel = random.choice(background_files)
            img_path_abs = os.path.join(ASSET_FOLDER, img_path_rel)
            if not os.path.exists(img_path_abs):
                print(f"   Warning: Background file not found: {img_path_abs}")
                continue

            bg_element = (ImageClip(img_path_abs)
                          .set_duration(DURATION)
                          .resize(height=bg_clip_size[1])
                          .resize(newsize=bg_clip_size)
                          .set_opacity(BG_OPACITY))
            try:
                 bg_element = blur(bg_element, x_size=BG_BLUR_AMOUNT, y_size=BG_BLUR_AMOUNT)
            except Exception as blur_err:
                 print(f"   Warning: Could not apply blur to background element {i}. Error: {blur_err}")

            start_x = random.uniform(-bg_clip_size[0] / 2, WIDTH - bg_clip_size[0] / 2)
            start_y = random.uniform(-bg_clip_size[1] / 2, HEIGHT - bg_clip_size[1] / 2)
            bg_element = bg_element.set_position((start_x, start_y)) # Set numeric position
            bg_element = subtle_drift(bg_element, BG_DRIFT_SPEED, DURATION) # Apply drift

            all_clips.append(bg_element)
        except Exception as e:
            print(f"   Error processing background element {i} from {img_path_rel}: {e}")

# 3. Framed Foreground Elements
print("3. Creating framed foreground elements...")
grid_spacing_x = (WIDTH - GRID_COLS * FOREGROUND_ITEM_W) / (GRID_COLS + 1)
grid_spacing_y = (HEIGHT - GRID_ROWS * FOREGROUND_ITEM_H) / (GRID_ROWS + 1)
item_index = 0

if not foreground_files:
     print("   ERROR: No foreground files specified!")
else:
    for r in range(GRID_ROWS):
        for c in range(GRID_COLS):
            if item_index < len(foreground_files):
                filepath_rel = foreground_files[item_index]
                filepath_abs = os.path.join(ASSET_FOLDER, filepath_rel)
                print(f"   Processing foreground item {item_index + 1}: {filepath_rel}")

                framed_clip = create_framed_clip(filepath_abs, FOREGROUND_ITEM_W, FOREGROUND_ITEM_H, FRAME_THICKNESS, FRAME_COLOR, DURATION)

                pos_x = grid_spacing_x + c * (FOREGROUND_ITEM_W + grid_spacing_x)
                pos_y = grid_spacing_y + r * (FOREGROUND_ITEM_H + grid_spacing_y)
                framed_clip = framed_clip.set_position((pos_x, pos_y)) # Set numeric position
                framed_clip = subtle_drift(framed_clip, FG_DRIFT_SPEED, DURATION) # Apply drift

                all_clips.append(framed_clip)
                item_index += 1
            else:
                break
        if item_index >= len(foreground_files):
             break

# 4. Logo / Text Overlay
print("4. Adding text/logo overlay...")
text_or_logo_added = False
if logo_file:
    logo_path = os.path.join(ASSET_FOLDER, logo_file)
    if os.path.exists(logo_path):
        try:
            logo = (ImageClip(logo_path)
                    .set_duration(DURATION)
                    .resize(height=int(HEIGHT * 0.08)) # Adjust size
                    .set_position(("right", "bottom"), margin=15) # Position with margin
                    .set_opacity(0.9))
            logo = logo.crossfadein(0.5)
            all_clips.append(logo)
            text_or_logo_added = True
            print(f"   Added logo: {logo_file}")
        except Exception as e:
             print(f"   Error adding logo '{logo_file}': {e}")
    else:
        print(f"   Warning: Logo file specified but not found: {logo_path}")

if not text_or_logo_added and channel_text:
    try:
        # Attempt to create TextClip
        txt_clip = (TextClip(channel_text, fontsize=30, color='white', font=font_path, stroke_color='black', stroke_width=1, method='caption', size=(WIDTH*0.4, None)) # Use caption method for potential wrapping
                    .set_position(("right", "bottom"), margin=15) # Relative position doesnt work well with drift, use fixed margin
                    .set_duration(DURATION))
        txt_clip = txt_clip.crossfadein(0.5)
        all_clips.append(txt_clip)
        print(f"   Added text: {channel_text}")
    except Exception as e:
         print(f"   Error creating TextClip (check font '{font_path}' or ImageMagick config): {e}")
         print("   If text fails, try a simpler font like 'Liberation-Sans' or check ImageMagick policy.")

# 5. Combine Visuals
print("5. Compositing video layers...")
# CompositeVideoClip layers are rendered bottom-to-top in the list order
final_visual = CompositeVideoClip(all_clips, size=(WIDTH, HEIGHT)).set_fps(FPS)

# 6. Add Audio
print("6. Processing audio...")
final_audio = None
audio_clips = []
narration_path = os.path.join(ASSET_FOLDER, narration_file)
music_path = os.path.join(ASSET_FOLDER, music_file)

if os.path.exists(narration_path):
    try:
        narration_audio = AudioFileClip(narration_path).volumex(NARRATION_VOLUME)
        # Trim narration if longer than video duration
        if narration_audio.duration > DURATION:
             narration_audio = narration_audio.subclip(0, DURATION)
        audio_clips.append(narration_audio)
        print(f"   Added narration: {narration_file}")
    except Exception as e:
        print(f"   Warning: Could not load narration audio '{narration_file}': {e}")
else:
    print(f"   Narration file '{narration_file}' not found, skipping.")


if os.path.exists(music_path):
     try:
        music_audio = AudioFileClip(music_path).volumex(MUSIC_VOLUME)
        if music_audio.duration > DURATION:
            music_audio = music_audio.subclip(0, DURATION)
        elif music_audio.duration < DURATION:
             music_audio = music_audio.loop(duration=DURATION) # Simple loop
        music_audio = music_audio.audio_fadeout(1.0) # Fade out last second
        audio_clips.append(music_audio)
        print(f"   Added background music: {music_file}")
     except Exception as e:
         print(f"   Warning: Could not load background music '{music_file}': {e}")
else:
    print(f"   Background music file '{music_file}' not found, skipping.")


if audio_clips:
    try:
        final_audio = CompositeAudioClip(audio_clips)
        final_visual = final_visual.set_audio(final_audio)
        print("   Audio mixing complete.")
    except Exception as e:
        print(f"   Error mixing audio: {e}")
        final_visual = final_visual.without_audio() # Ensure no faulty audio attached

# Ensure final clip has correct duration if audio was shorter/longer or no audio
final_visual = final_visual.set_duration(DURATION)

# 7. Write Output File
print(f"7. Writing final video to '{OUTPUT_FILENAME}' (this may take time)...")
try:
    # Recommended codecs for compatibility
    final_visual.write_videofile(
        OUTPUT_FILENAME,
        fps=FPS,
        codec='libx264',      # Standard video codec
        audio_codec='aac',    # Standard audio codec
        threads=4,            # Use multiple threads if available on Colab instance
        preset='medium'       # Encoding speed/quality balance ('slow' is higher quality but slower)
        # logger='bar'        # Use 'bar' logger for progress bar if preferred
    )
    print("\\n--- Video creation successful! ---")
    print(f"Download '{OUTPUT_FILENAME}' from the Colab file browser.")
except Exception as e:
    print("\\n--- ERROR during video writing ---")
    print(e)
    print("Check Colab logs, file permissions, or available disk space.")

# 8. Cleanup (Optional but good practice in notebooks)
print("8. Attempting to close clips (basic cleanup)...")
try:
    # It's tricky to close everything perfectly, especially with loops/composites
    # This is a basic attempt; MoviePy sometimes holds references
    if 'final_visual' in locals(): final_visual.close()
    if 'final_audio' in locals() and hasattr(final_audio, 'close'): final_audio.close()
    # Add more .close() calls for intermediate clips if needed and feasible
    print("   Basic cleanup attempt finished.")
except Exception as e:
    print(f"   Cleanup encountered an error: {e}")

`; // End of pythonScript template literal

        // --- Display Script and Enable Copy ---
        scriptOutputTextarea.value = pythonScript;
        outputSection.classList.remove('hidden'); // Show output area
        colabInstructionsSection.classList.remove('hidden'); // Show colab steps
        copyBtn.disabled = false; // Enable copy button
        copyBtn.textContent = 'Copy Script'; // Reset button text

        // Scroll to the script output smoothly
        outputSection.scrollIntoView({ behavior: 'smooth'});

    }); // End of generateBtn click listener


    // --- Copy Button Logic ---
    copyBtn.addEventListener('click', () => {
        scriptOutputTextarea.select(); // Select the text
        scriptOutputTextarea.setSelectionRange(0, 99999); // For mobile devices

        try {
            navigator.clipboard.writeText(scriptOutputTextarea.value).then(() => {
                // Success feedback
                copyBtn.textContent = 'Copied!';
                setTimeout(() => { copyBtn.textContent = 'Copy Script'; }, 2000); // Reset after 2s
            }, (err) => {
                // Error feedback (fallback for older browsers might be needed)
                console.error('Clipboard API failed: ', err);
                alert('Failed to copy script automatically. Please select and copy manually.');
                copyBtn.textContent = 'Copy Failed';
                 setTimeout(() => { copyBtn.textContent = 'Copy Script'; }, 3000);
            });
        } catch (err) {
            console.error('Clipboard API failed: ', err);
             alert('Failed to copy script automatically. Please select and copy manually.');
             copyBtn.textContent = 'Copy Failed';
             setTimeout(() => { copyBtn.textContent = 'Copy Script'; }, 3000);
        }
    });

}); // End of DOMContentLoaded listener