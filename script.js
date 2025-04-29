document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const fileInput = document.getElementById('fileInput');
    const fileCount = document.getElementById('fileCount');
    const previewArea = document.getElementById('previewArea');
    const generateScriptBtn = document.getElementById('generateScriptBtn');
    const scriptOutput = document.getElementById('scriptOutput');
    const copyScriptBtn = document.getElementById('copyScriptBtn');

    if (!selectFilesBtn || !fileInput || !fileCount || !previewArea || !generateScriptBtn || !scriptOutput || !copyScriptBtn) {
        console.error("Error: One or more essential DOM elements not found.");
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = '<p style="color: red; text-align: center;">Error initializing the application. Required elements are missing.</p>';
        }
        return;
    }

    // --- State ---
    let selectedFiles = []; // Array to hold the File objects

    // --- Event Listeners ---
    selectFilesBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelection);
    generateScriptBtn.addEventListener('click', generateColabScript);
    copyScriptBtn.addEventListener('click', copyScriptToClipboard);

    // --- Functions ---

    function handleFileSelection(event) {
        selectedFiles = Array.from(event.target.files);
        fileCount.textContent = `${selectedFiles.length} file(s) selected.`;
        generateScriptBtn.disabled = selectedFiles.length === 0;
        scriptOutput.value = '';
        copyScriptBtn.disabled = true;
        copyScriptBtn.textContent = 'Copy Script';
        renderFilePreviews();
        fileInput.value = null; // Allow re-selecting same files
    }

    function renderFilePreviews() {
        previewArea.innerHTML = '';
        if (selectedFiles.length === 0) {
            previewArea.innerHTML = '<p style="color: #aaa; text-align: center;">No files selected for preview.</p>';
            return;
        }
        selectedFiles.forEach(file => {
            const previewItem = document.createElement('div');
            previewItem.classList.add('preview-item');
            const objectURL = URL.createObjectURL(file);

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = objectURL;
                img.alt = `Preview of ${file.name}`;
                previewItem.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = objectURL;
                video.autoplay = true;
                video.muted = true;
                video.loop = true;
                video.setAttribute('playsinline', '');
                previewItem.appendChild(video);
            } else {
                previewItem.textContent = `.${file.name.split('.').pop() || 'file'}`;
                previewItem.style.fontSize = '0.8em';
                previewItem.style.color = '#ccc';
                previewItem.style.textAlign = 'center';
                previewItem.style.wordBreak = 'break-all';
            }
            previewArea.appendChild(previewItem);
            // Proper URL cleanup would involve revoking these on unload or replacement
        });
    }

    /**
     * Generates the Python script for Colab aiming for a dynamic, animated style.
     */
    function generateColabScript() {
        if (selectedFiles.length === 0) {
            alert("Please select files first.");
            return;
        }

        const filenames = selectedFiles.map(file => file.name);

        // --- Python Script Template for Dynamic Video ---
        const pythonScript = `
# === Colab Dynamic Video Composite Script ===
# Instructions:
# 1. Upload the following files to Colab session root:
#    ${filenames.map(name => `\n#    - ${name}`).join('')}
# 2. Run this cell. Output: dynamic_composite_output.mp4

print("--- Starting Dynamic Video Composition ---")

# --- 1. Install Dependencies ---
print("Installing moviepy...")
# Using a specific version known to work well can prevent issues
!pip install moviepy==1.0.3 numpy requests
print("Dependencies installed.")

import os
import gc
import random
import numpy as np
from moviepy.editor import *
# Attempt to import ImageClip for background, fallback if Pillow isn't implicitly installed
try:
    from PIL import Image
except ImportError:
    print("PIL/Pillow not found, background might be solid color.")
    Image = None # Flag that PIL is unavailable


# --- 2. Define Parameters ---
OUTPUT_FILENAME = "dynamic_composite_output.mp4"
WIDTH = 1920
HEIGHT = 1080
FPS = 30

TOTAL_VIDEO_DURATION = max(15, len(${JSON.stringify(filenames)}) * 1.5) # Total length of the output video (adjust logic as needed)
CLIP_ON_SCREEN_DURATION = 5 # How long each tile stays visible once fully faded in
ANIMATION_DURATION = 0.7 # Duration of fade-in/out animation
STAGGER_TIME = 0.4 # Base time between clip appearances (randomness added)

TILE_TARGET_WIDTH = 400 # Target width for tiles
BORDER_SIZE = 8
BORDER_COLOR = (200, 200, 200) # Lighter grey border
# BACKGROUND_COLOR = (30, 30, 35) # Slightly bluish dark grey
BACKGROUND_IMAGE_URL = "https://www.transparenttextures.com/patterns/black-linen.png" # Example texture


# List of input filenames
input_filenames = ${JSON.stringify(filenames)}
random.shuffle(input_filenames) # Shuffle order for variety

print(f"Target video duration: {TOTAL_VIDEO_DURATION:.2f}s")
print(f"Processing {len(input_filenames)} files...")

# --- 3. Helper Function for Background ---
def create_background(width, height, duration):
    # Try to download and use a texture image
    try:
        import requests
        from io import BytesIO
        if Image: # Check if PIL was imported
            print(f"Attempting to download background texture: {BACKGROUND_IMAGE_URL}")
            response = requests.get(BACKGROUND_IMAGE_URL, timeout=10) # Added timeout
            response.raise_for_status() # Raise an error for bad status codes
            img_data = BytesIO(response.content)
            pil_img = Image.open(img_data).convert('RGB') # Ensure RGB

            # Tile the image to cover the screen
            bg_w, bg_h = pil_img.size
            # Create a larger PIL image by tiling
            full_bg_pil = Image.new('RGB', (width, height))
            for i in range(0, width, bg_w):
                for j in range(0, height, bg_h):
                    full_bg_pil.paste(pil_img, (i, j))

            # Convert PIL image to MoviePy clip
            background = ImageClip(np.array(full_bg_pil)).set_duration(duration).set_fps(FPS)
            print("Using downloaded texture as background.")
            return background
        else:
             print("Pillow/PIL not available, falling back to solid color.")
             raise ImportError("PIL not available") # Raise error to go to except block
    except Exception as e:
        print(f"Could not create image background ({e}), using solid color.")
        # Fallback to solid color
        return ColorClip(size=(width, height), color=(30, 30, 35)).set_duration(duration).set_fps(FPS)


# --- 4. Processing Logic ---
processed_clips = []
clips_to_close = [] # Track clips for manual closing

# Create background first
background_clip = create_background(WIDTH, HEIGHT, TOTAL_VIDEO_DURATION)
clips_to_close.append(background_clip)

current_start_time = 0.5 # Start the first clip slightly after t=0

# Keep track of occupied areas/times to minimize direct overlap (simple approach)
occupied_zones = [] # Store tuples of (x_range, y_range, end_time)

MAX_ATTEMPTS_POSITION = 10 # Attempts to find a non-overlapping spot

for i, filename in enumerate(input_filenames):
    print(f"Processing {i+1}/{len(input_filenames)}: {filename}")
    try:
        if not os.path.exists(filename):
            print(f"  WARNING: File '{filename}' not found. Skipping.")
            continue

        # --- Load and Prepare Base Clip ---
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp')):
            clip = ImageClip(filename).set_duration(CLIP_ON_SCREEN_DURATION).set_fps(FPS)
        elif filename.lower().endswith(('.mp4', '.mov', '.avi', '.mkv', '.webm')):
            try:
                clip = VideoFileClip(filename, target_resolution=(None, 720)) # Limit load resolution
                # Ensure video is CLIP_ON_SCREEN_DURATION long (trim or use original if shorter)
                if clip.duration > CLIP_ON_SCREEN_DURATION:
                    clip = clip.subclip(0, CLIP_ON_SCREEN_DURATION)
                # Looping can be complex and memory intensive, let's just use the trimmed/original duration
                clip = clip.set_duration(min(clip.duration, CLIP_ON_SCREEN_DURATION)) # Use actual or target duration
            except Exception as video_load_error:
                print(f"  ERROR loading video '{filename}': {video_load_error}. Skipping.")
                if 'clip' in locals() and clip: clip.close()
                continue # Skip this file
        else:
            print(f"  WARNING: Unsupported file type '{filename}'. Skipping.")
            continue

        clips_to_close.append(clip) # Add base clip for cleanup

        # --- Resize and Add Border ---
        resized_clip = clip.resize(width=TILE_TARGET_WIDTH)
        clips_to_close.append(resized_clip)
        bordered_clip = resized_clip.margin(size=BORDER_SIZE, color=BORDER_COLOR)
        clips_to_close.append(bordered_clip) # Add bordered clip for potential early cleanup on error

        final_tile_w = bordered_clip.w
        final_tile_h = bordered_clip.h

        # --- Calculate Position and Timing ---
        position_found = False
        for attempt in range(MAX_ATTEMPTS_POSITION):
            # Random position, avoiding edges
            margin_x = int(final_tile_w * 0.2) # Keep away from edges
            margin_y = int(final_tile_h * 0.2)
            pos_x = random.randint(margin_x, WIDTH - final_tile_w - margin_x)
            pos_y = random.randint(margin_y, HEIGHT - final_tile_h - margin_y)

            # Simple overlap check: See if the *center* of this new clip placement
            # falls within an existing zone *during its visible time*
            is_overlapping = False
            clip_center_x = pos_x + final_tile_w / 2
            clip_center_y = pos_y + final_tile_h / 2
            clip_end_time = current_start_time + CLIP_ON_SCREEN_DURATION

            for zone_x, zone_y, zone_end_time in occupied_zones:
                 # Check time overlap and spatial overlap (based on center point)
                if clip_end_time > (zone_end_time - CLIP_ON_SCREEN_DURATION * 0.5) and \
                   current_start_time < zone_end_time: # Check time overlap (generous)
                    if zone_x[0] < clip_center_x < zone_x[1] and \
                       zone_y[0] < clip_center_y < zone_y[1]: # Check spatial overlap
                        is_overlapping = True
                        # print(f"    Overlap detected with zone ending at {zone_end_time:.2f}, attempt {attempt+1}")
                        break # Stop checking zones for this attempt

            if not is_overlapping:
                position_found = True
                occupied_zones.append(((pos_x, pos_x + final_tile_w), (pos_y, pos_y + final_tile_h), clip_end_time))
                break # Found a suitable spot

        if not position_found:
             print(f"  WARNING: Could not find a non-overlapping position for {filename} after {MAX_ATTEMPTS_POSITION} attempts. Placing randomly.")
             # Fallback to random position if no good spot found
             pos_x = random.randint(0, WIDTH - final_tile_w)
             pos_y = random.randint(0, HEIGHT - final_tile_h)


        # Make sure the clip doesn't run past the total duration
        effective_on_screen_duration = min(CLIP_ON_SCREEN_DURATION, TOTAL_VIDEO_DURATION - current_start_time - 0.1) # Ensure it fits
        if effective_on_screen_duration < ANIMATION_DURATION * 1.5: # Need time for fade in and to be visible
             print(f"  Skipping {filename} as it would appear too late in the video.")
             continue # Skip if it appears too late


        print(f"  Position: ({pos_x}, {pos_y}), Start: {current_start_time:.2f}s, Duration: {effective_on_screen_duration:.2f}s")

        # Apply effects: position, start time, duration, fadein
        final_clip = (bordered_clip
                      .set_position((pos_x, pos_y))
                      .set_start(current_start_time)
                      .set_duration(effective_on_screen_duration)
                      .fadein(ANIMATION_DURATION))
                      # .fadeout(ANIMATION_DURATION)) # Optional: Add fade out

        processed_clips.append(final_clip) # Don't add to clips_to_close, managed by CompositeVideoClip

        # --- Update Timing for Next Clip ---
        # Stagger the start times
        current_start_time += STAGGER_TIME + random.uniform(-STAGGER_TIME * 0.3, STAGGER_TIME * 0.3) # Add some randomness


    except Exception as e:
        print(f"  ERROR processing file '{filename}': {e}")
        # Ensure potential intermediate clips are closed if error occurred mid-processing
        if 'clip' in locals() and clip: clip.close()
        if 'resized_clip' in locals() and resized_clip: resized_clip.close()
        if 'bordered_clip' in locals() and bordered_clip: bordered_clip.close()
    finally:
         # Clean up base clip and resized clip to free memory, even if successful
         # Bordered clip is implicitly handled if added to processed_clips list
         # But we tracked it in clips_to_close earlier just in case of errors before appending
         # Let's refine cleanup: Only close base and resized if they exist
        if 'clip' in locals() and clip and clip in clips_to_close:
            clip.close()
            clips_to_close.remove(clip)
        if 'resized_clip' in locals() and resized_clip and resized_clip in clips_to_close:
            resized_clip.close()
            clips_to_close.remove(resized_clip)
        if 'bordered_clip' in locals() and bordered_clip and bordered_clip in clips_to_close:
             # If an error happened BEFORE adding to processed_clips, we need to close it
             if 'final_clip' not in locals() or bordered_clip != final_clip.clip: # Check if it became the final clip
                 bordered_clip.close()
                 clips_to_close.remove(bordered_clip)


        gc.collect() # Aggressive garbage collection


# --- 5. Create Composite Video ---
if not processed_clips:
    print("No valid clips were processed. Cannot create video.")
else:
    print("Composing final video...")
    # Combine background and all processed clips
    final_video = CompositeVideoClip([background_clip] + processed_clips, size=(WIDTH, HEIGHT))
    # The duration is already set by the background clip

    print(f"Writing video to {OUTPUT_FILENAME}...")
    try:
        final_video.write_videofile(
            OUTPUT_FILENAME,
            fps=FPS,
            codec='libx264',
            audio_codec='aac',
            threads=4, # Adjust based on Colab resources
            preset='medium', # 'medium' is a good balance
            logger='bar' # Show progress bar
        )
        print("Video writing complete.")
    except Exception as write_error:
        print(f"\n--- ERROR during video writing: {write_error} ---")
        print("Please check Colab resource usage (RAM, Disk). Try fewer/smaller files or shorter duration if issues persist.")

    # final_video.close() # CompositeVideoClip close is important
    # We will close it in the finally block


# --- 6. Cleanup ---
print("Cleaning up resources...")
try:
    if 'final_video' in locals() and final_video:
        final_video.close()
        print("  Closed final composite video.")

    # Close any remaining clips explicitly tracked
    closed_count = 0
    for clip_to_close in clips_to_close:
        try:
            if clip_to_close:
                 clip_to_close.close()
                 closed_count += 1
        except Exception as e_close:
            print(f"  Error closing an intermediate clip: {e_close}")
    # Using string concatenation:
print("  Closed " + str(closed_count) + " tracked intermediate clips.")
# Or using .format():
# print("  Closed {} tracked intermediate clips.".format(closed_count))

    # Note: Clips inside 'processed_clips' are references managed by CompositeVideoClip,
    # closing the final_video *should* handle them, but manual closure of intermediates is safer.

except Exception as cleanup_error:
     print(f"  Error during cleanup: {cleanup_error}")
finally:
    gc.collect()
    print("--- Dynamic Video Composition Script Finished ---")

`; // End of Python script template literal

        // Display the generated script
        scriptOutput.value = pythonScript;
        copyScriptBtn.disabled = false; // Enable the copy button
        copyScriptBtn.textContent = 'Copy Script';
        scriptOutput.scrollTop = 0; // Scroll to top

        console.log("Dynamic Python script generated.");
    }

    function copyScriptToClipboard() {
        if (!scriptOutput.value) return;
        navigator.clipboard.writeText(scriptOutput.value)
            .then(() => {
                copyScriptBtn.textContent = 'Copied!';
                setTimeout(() => {
                    if (copyScriptBtn.textContent === 'Copied!') {
                        copyScriptBtn.textContent = 'Copy Script';
                    }
                }, 2000);
            })
            .catch(err => {
                console.error("Failed to copy script: ", err);
                alert("Failed to copy script. Please copy it manually.");
                copyScriptBtn.textContent = 'Copy Failed';
            });
    }

    // Initial setup
    generateScriptBtn.disabled = true;
    copyScriptBtn.disabled = true;

}); // End DOMContentLoaded
