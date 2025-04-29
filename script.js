document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const fileInput = document.getElementById('fileInput');
    const fileCount = document.getElementById('fileCount');
    const previewArea = document.getElementById('previewArea');
    const generateScriptBtn = document.getElementById('generateScriptBtn');
    const scriptOutput = document.getElementById('scriptOutput');
    const copyScriptBtn = document.getElementById('copyScriptBtn');

    // Basic error handling for missing elements
    if (!selectFilesBtn || !fileInput || !fileCount || !previewArea || !generateScriptBtn || !scriptOutput || !copyScriptBtn) {
        console.error("Error: One or more essential DOM elements not found.");
        // Optionally display an error message to the user
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = '<p style="color: red; text-align: center;">Error initializing the application. Required elements are missing.</p>';
        }
        return; // Stop execution if elements are missing
    }

    // --- State ---
    let selectedFiles = []; // Array to hold the File objects

    // --- Event Listeners ---
    selectFilesBtn.addEventListener('click', () => {
        fileInput.click(); // Trigger hidden file input
    });

    fileInput.addEventListener('change', handleFileSelection);

    generateScriptBtn.addEventListener('click', generateColabScript);

    copyScriptBtn.addEventListener('click', copyScriptToClipboard);

    // --- Functions ---

    /**
     * Handles the file input change event.
     * Updates the state, UI, and renders previews.
     */
    function handleFileSelection(event) {
        selectedFiles = Array.from(event.target.files); // Store selected files

        // Update UI
        fileCount.textContent = `${selectedFiles.length} file(s) selected.`;
        generateScriptBtn.disabled = selectedFiles.length === 0; // Enable generate button if files are selected
        scriptOutput.value = ''; // Clear previous script
        copyScriptBtn.disabled = true; // Disable copy button until script is generated
        copyScriptBtn.textContent = 'Copy Script'; // Reset button text

        // Render previews
        renderFilePreviews();

        // Reset file input value to allow selecting the same files again if needed
        fileInput.value = null;
    }

    /**
     * Renders image and video previews in the preview area.
     */
    function renderFilePreviews() {
        previewArea.innerHTML = ''; // Clear previous previews

        if (selectedFiles.length === 0) {
            previewArea.innerHTML = '<p style="color: #aaa; text-align: center;">No files selected for preview.</p>';
            return;
        }

        selectedFiles.forEach(file => {
            const previewItem = document.createElement('div');
            previewItem.classList.add('preview-item');

            const objectURL = URL.createObjectURL(file); // Create temporary URL

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = objectURL;
                img.alt = `Preview of ${file.name}`;
                previewItem.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = objectURL;
                video.autoplay = true;
                video.muted = true; // Autoplay usually requires muted
                video.loop = true;
                video.setAttribute('playsinline', ''); // Helps with mobile playback
                previewItem.appendChild(video);
            } else {
                // Handle other file types or show a placeholder
                previewItem.textContent = `.${file.name.split('.').pop() || 'file'}`;
                previewItem.style.fontSize = '0.8em';
                previewItem.style.color = '#ccc';
                previewItem.style.textAlign = 'center';
                 previewItem.style.wordBreak = 'break-all'; // Prevent long extensions overflowing
            }

            previewArea.appendChild(previewItem);

             // Note: Ideally, revokeObjectURL should be called when the preview is no longer needed.
             // For simplicity here, we rely on the browser to clean up when the page/tab is closed.
             // In a more complex app, manage these URLs explicitly (e.g., store URLs and revoke on re-selection or unmount).
             // img.onload = img.onerror = () => URL.revokeObjectURL(objectURL); // Example for explicit cleanup
        });
    }

    /**
     * Generates the Python script for Colab based on selected files.
     */
    function generateColabScript() {
        if (selectedFiles.length === 0) {
            alert("Please select files first.");
            return;
        }

        const filenames = selectedFiles.map(file => file.name);

        // --- Python Script Template ---
        // We use a template literal for easy multi-line string creation.
        // Escape backticks (`) within the Python code if necessary.
        const pythonScript = `
# === Colab Video Composite Script ===
# Instructions:
# 1. Make sure you have uploaded the following files to the Colab session's
#    root directory (use the file browser panel on the left):
#    ${filenames.map(name => `\n#    - ${name}`).join('')}
# 2. Run this cell. It will install necessary libraries and create the video.

print("--- Starting Video Composition ---")

# --- 1. Install Dependencies ---
print("Installing moviepy (version 1.0.3 required)...")
!pip install moviepy==1.0.3 numpy
print("Dependencies installed.")
import os
import gc
import numpy as np
from moviepy.editor import *

# --- 2. Define Parameters ---
OUTPUT_FILENAME = "composite_output_1080p.mp4"
WIDTH = 1920
HEIGHT = 1080
FPS = 30
CLIP_DURATION = 7  # Duration (in seconds) for each clip segment
TILE_TARGET_WIDTH = 480 # Target width for each tile before adding border
BORDER_SIZE = 10      # Border size around each tile in pixels
BORDER_COLOR = (255, 255, 255) # White border (RGB)
BACKGROUND_COLOR = (26, 26, 26) # Dark grey background (RGB)

# List of input filenames (MATCH THESE TO YOUR UPLOADED FILES)
input_filenames = ${JSON.stringify(filenames)}

print(f"Processing {len(input_filenames)} files...")

# --- 3. Processing Logic ---
processed_clips = []
clips_to_close = [] # Keep track of clips to close explicitly

try:
    # Calculate grid layout dynamically
    num_files = len(input_filenames)
    # Simple grid calculation - adjust as needed for better layouts
    num_cols = int(np.ceil(np.sqrt(num_files)))
    num_rows = int(np.ceil(num_files / num_cols))

    # Calculate total dimensions needed for tiles + gaps (simplified: assume gaps are part of positioning)
    # Calculate starting positions to center the grid (approximate)
    total_grid_width = num_cols * (TILE_TARGET_WIDTH + 2 * BORDER_SIZE)
    total_grid_height = num_rows * (TILE_TARGET_WIDTH * (HEIGHT/WIDTH) + 2 * BORDER_SIZE) # Estimate height based on width aspect ratio
    
    # Calculate cell size including border for positioning
    cell_width = (TILE_TARGET_WIDTH + 2 * BORDER_SIZE) + 20 # Add some extra spacing
    cell_height_approx = (TILE_TARGET_WIDTH * (9/16) + 2 * BORDER_SIZE) + 20 # Estimate based on 16:9, add spacing


    start_x = max(0, (WIDTH - (num_cols * cell_width)) // 2)
    start_y = max(0, (HEIGHT - (num_rows * cell_height_approx)) // 2)


    print(f"Grid Layout: {num_cols} columns, {num_rows} rows.")
    print(f"Calculated start position: ({start_x}, {start_y})")


    for i, filename in enumerate(input_filenames):
        print(f"Processing {i+1}/{num_files}: {filename}")
        try:
            if not os.path.exists(filename):
                print(f"  WARNING: File '{filename}' not found in Colab environment. Skipping.")
                continue

            # Load clip (Image or Video)
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp')):
                clip = ImageClip(filename)
                clip = clip.set_duration(CLIP_DURATION) # Set duration for images
                is_video = False
            elif filename.lower().endswith(('.mp4', '.mov', '.avi', '.mkv', '.webm')):
                clip = VideoFileClip(filename, target_resolution=(None, 1080)) # Load video, limit height
                 # Trim or loop video to fit CLIP_DURATION
                if clip.duration > CLIP_DURATION:
                    clip = clip.subclip(0, CLIP_DURATION)
                elif clip.duration < CLIP_DURATION:
                     # Loop requires moviepy >= 1.0.0; simple loop:
                     # clip = clip.loop(duration=CLIP_DURATION)
                     # Simpler: just use its original duration if shorter
                     print(f"  Info: Video '{filename}' is shorter ({clip.duration}s) than target duration ({CLIP_DURATION}s). Using original duration for this clip.")
                     pass # Use original shorter duration
                is_video = True
            else:
                print(f"  WARNING: Unsupported file type for '{filename}'. Skipping.")
                continue

            clips_to_close.append(clip) # Add original clip for later closing

            # Resize clip maintaining aspect ratio
            resized_clip = clip.resize(width=TILE_TARGET_WIDTH)
            clips_to_close.append(resized_clip)

            # Add border
            bordered_clip = resized_clip.margin(size=BORDER_SIZE, color=BORDER_COLOR)
            clips_to_close.append(bordered_clip)

            # Calculate position
            col = i % num_cols
            row = i // num_cols
            
            # Calculate final tile size *after* border for positioning
            final_tile_width = bordered_clip.w
            final_tile_height = bordered_clip.h
            
            # Recalculate cell sizes based on actual content + spacing
            pos_x = start_x + col * (final_tile_width + 20) # Add 20px horizontal spacing
            pos_y = start_y + row * (final_tile_height + 20) # Add 20px vertical spacing

            # Ensure position is integer
            pos_x = int(pos_x)
            pos_y = int(pos_y)
            
            print(f"  Positioning '{filename}' at ({pos_x}, {pos_y})")


            # Set position and start time
            positioned_clip = bordered_clip.set_position((pos_x, pos_y)).set_start(0)
            # We don't add positioned_clip to clips_to_close because it's the final one we use

            processed_clips.append(positioned_clip)

        except Exception as e:
            print(f"  ERROR processing file '{filename}': {e}")
            # Attempt to close any intermediate clips created for this file
            if 'clip' in locals() and clip: clip.close()
            if 'resized_clip' in locals() and resized_clip: resized_clip.close()
            if 'bordered_clip' in locals() and bordered_clip: bordered_clip.close()


        # Optional: Aggressive garbage collection within the loop for memory-constrained environments
        # gc.collect()

    # --- 4. Create Composite Video ---
    if not processed_clips:
        print("No valid clips were processed. Cannot create video.")
    else:
        print("Creating background clip...")
        background_clip = ColorClip(size=(WIDTH, HEIGHT), color=BACKGROUND_COLOR)
        background_clip = background_clip.set_duration(CLIP_DURATION).set_start(0) # Make sure background has duration
        clips_to_close.append(background_clip) # Add background for cleanup


        print("Composing final video...")
        # Combine background and all processed clips
        final_clip = CompositeVideoClip([background_clip] + processed_clips, size=(WIDTH, HEIGHT))
        final_clip = final_clip.set_duration(CLIP_DURATION) # Set final duration

        print(f"Writing video to {OUTPUT_FILENAME}...")
        # Write the result to a file
        final_clip.write_videofile(
            OUTPUT_FILENAME,
            fps=FPS,
            codec='libx264',      # Standard video codec
            audio_codec='aac',    # Standard audio codec
            threads=4,            # Use multiple threads for faster encoding (adjust based on Colab resources)
            preset='medium'       # Encoding speed/quality trade-off ('ultrafast', 'medium', 'slow')
            # logger='bar'        # Use 'bar' for a progress bar, None for less output
        )

        print("Closing final composite clip...")
        final_clip.close()


except Exception as e:
    print(f"\n--- An unexpected error occurred during the process: {e} ---")

finally:
    # --- 5. Cleanup ---
    print("Cleaning up resources...")
    # Close all intermediate and processed clips
    # Note: positioned_clip is implicitly handled by final_clip closure if it's the last reference
    # Closing clips added to processed_clips list:
    for p_clip in processed_clips:
         try:
             if p_clip: p_clip.close()
         except Exception as e_close:
            print(f"  Error closing a processed clip: {e_close}")
            
    # Closing clips tracked explicitly:
    for clip_to_close in clips_to_close:
        try:
            if clip_to_close: clip_to_close.close()
        except Exception as e_close:
            print(f"  Error closing an intermediate clip: {e_close}")


    # Explicit garbage collection
    gc.collect()
    print("--- Video Composition Script Finished ---")

`; // End of Python script template literal

        // Display the generated script
        scriptOutput.value = pythonScript;
        copyScriptBtn.disabled = false; // Enable the copy button
        copyScriptBtn.textContent = 'Copy Script'; // Reset text just in case

        // Scroll textarea to top
        scriptOutput.scrollTop = 0;

        console.log("Python script generated.");
    }

    /**
     * Copies the generated Python script from the textarea to the clipboard.
     */
    function copyScriptToClipboard() {
        if (!scriptOutput.value) {
            console.warn("No script generated to copy.");
            return;
        }

        navigator.clipboard.writeText(scriptOutput.value)
            .then(() => {
                console.log("Script copied to clipboard!");
                copyScriptBtn.textContent = 'Copied!'; // Provide feedback
                // Optionally revert text after a delay
                setTimeout(() => {
                    // Only revert if it still says "Copied!" (user might have generated again)
                    if (copyScriptBtn.textContent === 'Copied!') {
                        copyScriptBtn.textContent = 'Copy Script';
                    }
                }, 2000); // Revert after 2 seconds
            })
            .catch(err => {
                console.error("Failed to copy script: ", err);
                alert("Failed to copy script. Please copy it manually from the text area.");
                 copyScriptBtn.textContent = 'Copy Failed';
            });
    }

    // --- Initial Setup ---
    // Ensure buttons are in the correct initial state (although defaults in HTML work too)
    generateScriptBtn.disabled = true;
    copyScriptBtn.disabled = true;

}); // End DOMContentLoaded