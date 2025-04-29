// --- DOM Element References ---
const selectFilesBtn = document.getElementById('selectFilesBtn');
const fileInput = document.getElementById('fileInput');
const previewGrid = document.getElementById('previewGrid');
const generateScriptBtn = document.getElementById('generateScriptBtn');
const pythonScriptOutput = document.getElementById('pythonScriptOutput');
const fileCountSpan = document.getElementById('fileCount');
const copyScriptBtn = document.getElementById('copyScriptBtn');

// --- State Variables ---
let selectedFiles = []; // Array to store the actual File objects
let objectUrls = []; // To keep track of video URLs for cleanup

// --- Event Listeners ---

selectFilesBtn.addEventListener('click', () => {
    fileInput.click(); // Trigger the hidden file input
});

fileInput.addEventListener('change', handleFileSelection);

generateScriptBtn.addEventListener('click', generateAndDisplayScript);

copyScriptBtn.addEventListener('click', copyScriptToClipboard);


// --- Core Functions ---

function handleFileSelection(event) {
    // Clear previous previews and stored files
    clearPreviews();
    selectedFiles = Array.from(event.target.files); // Create a new array from FileList

    if (selectedFiles.length > 0) {
        displayPreviews();
        generateScriptBtn.disabled = false; // Enable script generation
        fileCountSpan.textContent = `${selectedFiles.length} file(s) selected`;
    } else {
        // Reset if no files were selected
        generateScriptBtn.disabled = true;
        copyScriptBtn.disabled = true;
        pythonScriptOutput.value = ''; // Clear script output if no files
        fileCountSpan.textContent = `0 files selected`;
    }
}

function displayPreviews() {
    selectedFiles.forEach(file => {
        const item = document.createElement('div');
        item.classList.add('grid-item');

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
                img.alt = file.name; // Add alt text
            }
            reader.readAsDataURL(file);
            item.appendChild(img);

        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            const url = URL.createObjectURL(file);
            objectUrls.push(url); // Store URL for later cleanup
            video.src = url;
            video.muted = true; // Necessary for autoplay in many browsers
            video.loop = true;
            video.playsInline = true; // Good practice for mobile
            video.autoplay = true; // Try to autoplay previews
            // video.controls = true; // Optional: show controls
            item.appendChild(video);
        } else {
             // Handle non-image/video files (optional: show filename or icon)
             item.textContent = file.name; // Simple placeholder
             item.style.fontSize = '12px';
             item.style.wordBreak = 'break-all';
             item.style.padding = '5px';
             item.style.color = '#a0a0a0';
        }
        previewGrid.appendChild(item);
    });
}

function clearPreviews() {
    previewGrid.innerHTML = ''; // Clear the grid visually
    // Revoke old video object URLs to free memory
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls = []; // Reset the array
    selectedFiles = []; // Clear the stored file objects
    // Reset UI elements
    generateScriptBtn.disabled = true;
    copyScriptBtn.disabled = true;
    pythonScriptOutput.value = '';
    fileCountSpan.textContent = `0 files selected`;
    if (fileInput) {
      fileInput.value = ""; // Clear the actual file input element state
    }
}

function generateAndDisplayScript() {
    if (selectedFiles.length === 0) {
        alert("Please select files first!");
        return;
    }

    const filenames = selectedFiles.map(file => file.name);
    const pythonScript = generatePythonScript(filenames); // Call the NEW composite script generator
    pythonScriptOutput.value = pythonScript;
    copyScriptBtn.disabled = false; // Enable copy button
}

function copyScriptToClipboard() {
    if (!pythonScriptOutput.value) return; // Nothing to copy

    pythonScriptOutput.select(); // Select the text
    pythonScriptOutput.setSelectionRange(0, 99999); // For mobile devices

    try {
        // Use Clipboard API if available (more modern)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(pythonScriptOutput.value).then(() => {
                alert('Python script copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy script using Clipboard API: ', err);
                // Fallback to execCommand
                tryCopyExecCommand();
            });
        } else {
            // Fallback for older browsers
            tryCopyExecCommand();
        }
    } catch (err) {
        console.error('Error invoking copy mechanism: ', err);
        alert('Failed to copy script automatically. Please copy it manually.');
    }
    window.getSelection().removeAllRanges(); // Deselect text
}

function tryCopyExecCommand() {
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            alert('Python script copied to clipboard!');
        } else {
            throw new Error('execCommand returned false');
        }
    } catch (err) {
        console.error('Failed to copy script using execCommand: ', err);
        alert('Failed to copy script automatically. Please copy it manually.');
    }
}


// --- Python Script Generation (REVISED for Compositing) ---

function generatePythonScript(filenames) {
    // Escape backticks and dollar signs in filenames for the template literal
    const safeFilenames = filenames.map(name => name.replace(/`/g, '\\`').replace(/\$/g, '\\$'));

    // Convert the safe filenames array into a Python list string representation
    const pythonFilenamesList = `[${safeFilenames.map(name => `"${name.replace(/"/g, '\\"')}"`).join(', ')}]`; // Ensure quotes inside filenames are escaped for Python

    // --- Configuration for Composite Video ---
    const clipWidth = 480;      // Width of each individual clip frame in pixels
    const clipBorder = 10;       // Border width around each clip frame
    const borderColor = '(200, 200, 200)'; // Border color (RGB tuple as string)
    const imageDuration = 7;     // Duration for static images in seconds
    const totalDuration = Math.max(imageDuration, 10); // Minimum total duration, adjust if needed
    const targetWidth = 1920;    // Output video width (1080p)
    const targetHeight = 1080;   // Output video height (1080p)
    const outputFps = 30;
    const outputFilename = "composite_output_1080p.mp4";
    const backgroundColor = '(15, 15, 15)'; // Dark background color (RGB tuple as string)
    // ---

    // Use template literals for the Python script
    return `
# Python Script for Google Colab Video Generation (Composite Style)
# Generated by Web Preview App

# IMPORTANT: Before running, upload the EXACT SAME files listed below
#            to your Colab session's file directory!

# ----------------------------------------
# 1. Setup Environment
# ----------------------------------------
print("Installing necessary libraries...")
# Pin numpy version for potential compatibility issues in Colab environments
# MoviePy 1.0.3 often works well with numpy < 1.24
try:
    import numpy
    print(f"Existing numpy version: {numpy.__version__}")
    # Example check: if numpy version is too high, reinstall a specific one
    # if tuple(map(int, numpy.__version__.split('.')[:2])) >= (1, 24):
    #      print("Attempting to install specific numpy version for MoviePy compatibility...")
    #      !pip install numpy==1.23.5 --force-reinstall -q
except ImportError:
    print("Numpy not found, installing.")
    !pip install numpy==1.23.5 -q

!pip install moviepy==1.0.3 -q # Use '-q' for quieter installation
print("Installation check complete.")
print("-" * 40)

# ----------------------------------------
# 2. Import Libraries
# ----------------------------------------
import os
import random
import traceback
from moviepy.editor import *
import numpy as np # Needed for color clips and positioning
import gc # Garbage collection

print("Libraries imported.")
print("-" * 40)

# ----------------------------------------
# 3. Configuration
# ----------------------------------------
source_filenames = ${pythonFilenamesList}

CLIP_WIDTH_PX = ${clipWidth}
CLIP_BORDER_PX = ${clipBorder}
BORDER_COLOR_RGB = ${borderColor} # e.g., (255, 255, 255) for white
IMAGE_DURATION_SECONDS = ${imageDuration}
TOTAL_VIDEO_DURATION = ${totalDuration} # Fixed total duration for simplicity
TARGET_WIDTH = ${targetWidth}
TARGET_HEIGHT = ${targetHeight}
OUTPUT_FPS = ${outputFps}
OUTPUT_FILENAME = "${outputFilename}"
BACKGROUND_COLOR_RGB = ${backgroundColor} # e.g., (0, 0, 0) for black

# Add more extensions if needed (case-insensitive)
IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.bmp'] # Avoid GIF for simple compositing unless specific handling added
VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm']

print("Configuration:")
print(f" - Source Files: {len(source_filenames)} items")
print(f" - Clip Frame Width: {CLIP_WIDTH_PX}px")
print(f" - Clip Border: {CLIP_BORDER_PX}px")
print(f" - Image Duration: {IMAGE_DURATION_SECONDS}s")
print(f" - Target Resolution: {TARGET_WIDTH}x{TARGET_HEIGHT}")
print(f" - Output FPS: {OUTPUT_FPS}")
print(f" - Output Filename: {OUTPUT_FILENAME}")
print("-" * 40)

# ----------------------------------------
# 4. Processing Logic
# ----------------------------------------
processed_clips_for_composite = []
files_missing = []
files_processed = []
files_failed = []

# --- Define potential positions ---
# Simple grid layout calculation
num_files = len(source_filenames)
# Calculate grid size (simple approach: aim for roughly square)
cols = int(np.ceil(np.sqrt(num_files)))
rows = int(np.ceil(num_files / cols))

# Calculate spacing based on target size and number of columns/rows
# Leave some padding around the edges
padding = 50 # Pixels padding from edge of screen
available_width = TARGET_WIDTH - 2 * padding
available_height = TARGET_HEIGHT - 2 * padding
cell_width = available_width / cols
cell_height = available_height / rows

# Determine actual clip dimensions to fit cells (minus border)
max_clip_area_width = cell_width - 2 * CLIP_BORDER_PX - 20 # Add some spacing between cells
max_clip_area_height = cell_height - 2 * CLIP_BORDER_PX - 20

# Use the smaller of the configured width or the calculated max width
final_clip_width = min(CLIP_WIDTH_PX, max_clip_area_width)
print(f"Calculated grid: {rows} rows x {cols} cols")
print(f"Adjusted clip width to fit grid: {final_clip_width}px (max possible: {max_clip_area_width}px)")

# Generate positions based on grid
grid_positions = []
for r in range(rows):
    for c in range(cols):
        if len(grid_positions) < num_files: # Only generate positions for the files we have
            # Calculate center of the cell
            cell_center_x = padding + c * cell_width + cell_width / 2
            cell_center_y = padding + r * cell_height + cell_height / 2
            grid_positions.append(('center', cell_center_y)) # Position based on cell center Y, X will be centered by moviepy

position_index = 0

print("Starting processing for composite video...")

for idx, filename in enumerate(source_filenames):
    print(f"Processing: {filename}...")
    if not os.path.exists(filename):
        print(f"  ERROR: File not found in Colab environment: {filename}")
        files_missing.append(filename)
        continue

    try:
        _, ext = os.path.splitext(filename.lower())
        clip = None

        if ext in IMAGE_EXTENSIONS:
            print(f"  Type: Image")
            clip = ImageClip(filename).set_duration(IMAGE_DURATION_SECONDS)
            # Resize image based on the final calculated width
            clip = clip.resize(width=final_clip_width)
            clip = clip.set_fps(OUTPUT_FPS) # Set FPS for consistency

        elif ext in VIDEO_EXTENSIONS:
            print(f"  Type: Video")
            # Load video and resize based on width
            clip = VideoFileClip(filename, target_resolution=(None, 10000)) # Load full res first
            clip = clip.resize(width=final_clip_width)
            # Trim or loop video to match the image duration for simplicity in this example
            if clip.duration > IMAGE_DURATION_SECONDS:
                 print(f"  Trimming video to {IMAGE_DURATION_SECONDS}s")
                 clip = clip.subclip(0, IMAGE_DURATION_SECONDS)
            elif clip.duration < IMAGE_DURATION_SECONDS:
                 print(f"  Looping video to reach {IMAGE_DURATION_SECONDS}s")
                 clip = clip.loop(duration=IMAGE_DURATION_SECONDS)
            # Ensure FPS if needed
            if clip.fps is None: clip = clip.set_fps(OUTPUT_FPS)


        else:
            print(f"  WARNING: Unsupported file type: {filename} - Skipping")
            files_failed.append(f"{filename} (Unsupported type)")
            continue

        # Add border using margin
        print(f"  Adding border: {CLIP_BORDER_PX}px")
        clip = clip.margin(all=CLIP_BORDER_PX, color=BORDER_COLOR_RGB)

        # Assign position from the calculated grid
        pos = grid_positions[position_index]
         # Adjust position to center the clip within its calculated cell space
         # Moviepy's 'center' for X works well, Y needs calculation
        pos_x = 'center'
        cell_center_y = pos[1]
        # Calculate top Y coordinate based on clip height and cell center
        pos_y = cell_center_y - clip.h / 2
        final_pos = (pos_x, pos_y)

        print(f"  Assigning position: {final_pos}")
        clip = clip.set_position(final_pos) # Use absolute pixel positions now

        position_index += 1


        # Set start time (for now, all start at 0, could be staggered)
        clip = clip.set_start(0) # All clips start immediately

        # Ensure duration doesn't exceed total (already handled by image duration/video trim/loop)
        clip = clip.set_duration(IMAGE_DURATION_SECONDS) # All clips have same duration now

        processed_clips_for_composite.append(clip)
        files_processed.append(filename)
        print(f"  Successfully prepared: {filename}")

    except Exception as e:
        print(f"  ERROR processing file {filename}: {e}")
        print(traceback.format_exc())
        files_failed.append(f"{filename} (Processing error)")

print("-" * 40)

# ----------------------------------------
# 5. Create Background and Composite
# ----------------------------------------
if not processed_clips_for_composite:
    print("ERROR: No clips were successfully processed. Cannot create video.")
else:
    print("Creating background clip...")
    # Simple colored background
    background_clip = ColorClip(size=(TARGET_WIDTH, TARGET_HEIGHT),
                                color=BACKGROUND_COLOR_RGB,
                                ismask=False,
                                duration=TOTAL_VIDEO_DURATION) # Duration must match the composite


    print(f"Compositing {len(processed_clips_for_composite)} clips onto background...")
    # Layer clips onto the background. Background should be first.
    final_clip = CompositeVideoClip([background_clip] + processed_clips_for_composite,
                                    size=(TARGET_WIDTH, TARGET_HEIGHT))

    # Set the duration of the final composite clip explicitly
    final_clip = final_clip.set_duration(TOTAL_VIDEO_DURATION)

    print(f"Writing final composite video to: {OUTPUT_FILENAME} (This may take time)...")
    try:
        final_clip.write_videofile(
            OUTPUT_FILENAME,
            fps=OUTPUT_FPS,
            codec='libx264',
            audio_codec='aac',
            preset='medium', # Adjust preset ('ultrafast' for speed, 'slow' for quality/size)
            threads=4 # Use multiple threads available in Colab
        )
        print("-" * 40)
        print(f"SUCCESS! Composite video saved as {OUTPUT_FILENAME}.")

    except Exception as e:
        print(f"ERROR during final compositing or export: {e}")
        print(traceback.format_exc())
    finally:
        # Clean up memory - CRUCIAL in Colab
        print("Closing clips and collecting garbage...")
        try:
            if 'background_clip' in locals() and background_clip: background_clip.close()
        except Exception as e_close: print(f"Error closing background: {e_close}")
        for clip in processed_clips_for_composite:
             try:
                 if clip: clip.close()
             except Exception as e_close: print(f"Error closing processed clip: {e_close}")
        try:
             if 'final_clip' in locals() and final_clip: final_clip.close()
        except Exception as e_close: print(f"Error closing final clip: {e_close}")

        # Force garbage collection
        processed_clips_for_composite.clear() # Clear the list
        gc.collect()
        print("Cleanup attempted.")


print("-" * 40)
print("Script finished.")

# Summary Report
print("\\n--- Processing Summary ---")
print(f"Total files selected: {len(source_filenames)}")
print(f"Successfully processed: {len(files_processed)}")
if files_processed: print(f"  {files_processed}")
print(f"Missing files (not found in Colab): {len(files_missing)}")
if files_missing: print(f"  {files_missing}")
print(f"Failed/Skipped files: {len(files_failed)}")
if files_failed: print(f"  {files_failed}")
print("--------------------------")

`; // End of template literal
}

// --- Initial State ---
// Ensure buttons are disabled initially until files are selected
generateScriptBtn.disabled = true;
copyScriptBtn.disabled = true;
