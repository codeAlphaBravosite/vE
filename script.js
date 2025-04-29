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

// --- Utility Functions ---
function logError(message, error = null) {
    console.error(message, error);
    // Optionally, display user-friendly error messages on the page
}

// --- Event Listeners ---

// Ensure the buttons exist before adding listeners
if (selectFilesBtn) {
    selectFilesBtn.addEventListener('click', () => {
        if (fileInput) {
            fileInput.click(); // Trigger the hidden file input
        } else {
            logError("Error: File input element not found.");
        }
    });
} else {
    logError("Error: Select Files button not found.");
}

if (fileInput) {
    fileInput.addEventListener('change', handleFileSelection);
} else {
    logError("Error: File input element not found for change listener.");
}

if (generateScriptBtn) {
    generateScriptBtn.addEventListener('click', generateAndDisplayScript);
} else {
    logError("Error: Generate Script button not found.");
}

if (copyScriptBtn) {
    copyScriptBtn.addEventListener('click', copyScriptToClipboard);
} else {
    logError("Error: Copy Script button not found.");
}


// --- Core Functions ---

function handleFileSelection(event) {
    console.log("handleFileSelection triggered.");
    try {
        // Clear previous previews and stored files FIRST
        clearPreviews();

        // Access files from the event target
        const files = event.target.files;
        if (!files) {
             logError("No files found in event target.");
             return;
        }
        selectedFiles = Array.from(files); // Create a new array from FileList
        console.log(`Files selected: ${selectedFiles.length}`, selectedFiles);


        if (selectedFiles.length > 0) {
            if (fileCountSpan) {
                 fileCountSpan.textContent = `${selectedFiles.length} file(s) selected`;
            }
            // Generate previews
            displayPreviews();
            // Enable the generate button
            if (generateScriptBtn) {
                 generateScriptBtn.disabled = false;
            }
        } else {
            // Reset UI if no files are selected (already handled by clearPreviews)
            console.log("No files selected or selection cleared.");
        }
    } catch (error) {
        logError("Error during file selection handling:", error);
        // Ensure UI is reset in case of error
        clearPreviews();
    }
}

function displayPreviews() {
    console.log("displayPreviews called.");
    if (!previewGrid) {
        logError("Error: Preview grid container not found.");
        return;
    }

    selectedFiles.forEach((file, index) => {
        console.log(`Processing file ${index + 1}: ${file.name}, Type: ${file.type}`);
        const item = document.createElement('div');
        item.classList.add('grid-item');

        try {
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.alt = `Preview of ${file.name}`; // Add alt text

                const reader = new FileReader();

                reader.onload = (e) => {
                    console.log(`FileReader loaded for: ${file.name}`);
                    img.src = e.target.result;
                    item.appendChild(img); // Append image *after* src is set
                    previewGrid.appendChild(item); // Append item to grid
                    console.log(`Appended image item for: ${file.name}`);
                };

                reader.onerror = (e) => {
                    logError(`FileReader error for file ${file.name}:`, reader.error);
                    // Display simple error in the grid item
                    item.textContent = `Error loading ${file.name}`;
                    item.style.color = 'red';
                    item.style.fontSize = '10px';
                    previewGrid.appendChild(item);
                };

                reader.readAsDataURL(file);

            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                const url = URL.createObjectURL(file);
                objectUrls.push(url); // Store URL for later cleanup

                video.src = url;
                video.muted = true; // Necessary for autoplay
                video.loop = true;
                video.playsInline = true; // Good practice
                video.autoplay = true;
                // video.controls = true; // Optional: show controls

                // Add error handling for video loading
                video.onerror = (e) => {
                     logError(`Error loading video ${file.name}:`, e);
                     item.textContent = `Error loading video ${file.name}`;
                     item.style.color = 'red';
                     item.style.fontSize = '10px';
                     // Ensure item is appended even if video fails to load src
                     if (!item.parentNode) {
                         previewGrid.appendChild(item);
                     }
                };
                 video.onloadeddata = () => {
                     console.log(`Video data loaded for: ${file.name}`);
                 };


                item.appendChild(video);
                previewGrid.appendChild(item); // Append item to grid
                 console.log(`Appended video item for: ${file.name}`);

            } else {
                 // Handle non-image/video files
                 console.log(`Unsupported file type: ${file.name}`);
                 item.textContent = file.name; // Simple placeholder
                 item.style.fontSize = '11px';
                 item.style.wordBreak = 'break-all';
                 item.style.padding = '5px';
                 item.style.textAlign = 'center';
                 item.style.color = '#a0a0a0';
                 previewGrid.appendChild(item); // Append item to grid
                 console.log(`Appended placeholder item for: ${file.name}`);
            }
        } catch (error) {
            logError(`Error processing file ${file.name} for preview:`, error);
            // Attempt to append a generic error item
            try {
                 if (!item.parentNode) { // Avoid appending twice if error happens after append
                    item.textContent = `Error previewing ${file.name}`;
                    item.style.color = 'red';
                    item.style.fontSize = '10px';
                    previewGrid.appendChild(item);
                 }
            } catch (appendError) {
                logError("Error appending error item:", appendError);
            }
        }
    });
    console.log("displayPreviews finished.");
}


function clearPreviews() {
    console.log("clearPreviews called.");
    // Clear the grid visually
    if (previewGrid) {
        previewGrid.innerHTML = '';
    }
    // Revoke old video object URLs to free memory
    console.log(`Revoking ${objectUrls.length} object URLs.`);
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls = []; // Reset the array

    // Clear the stored file objects
    selectedFiles = [];
    console.log("Cleared selectedFiles array.");

    // Reset UI elements
    if (generateScriptBtn) generateScriptBtn.disabled = true;
    if (copyScriptBtn) copyScriptBtn.disabled = true;
    if (pythonScriptOutput) pythonScriptOutput.value = '';
    if (fileCountSpan) fileCountSpan.textContent = `0 files selected`;

    // IMPORTANT: Also clear the actual file input element's value.
    // This allows selecting the same file(s) again if needed.
    if (fileInput) {
      fileInput.value = "";
      console.log("Cleared file input value.");
    }
}

function generateAndDisplayScript() {
    console.log("generateAndDisplayScript called.");
    if (selectedFiles.length === 0) {
        alert("Please select files first!");
        console.warn("Generate script called with no files selected.");
        return;
    }

    try {
        const filenames = selectedFiles.map(file => file.name);
        console.log("Generating script for filenames:", filenames);
        const pythonScript = generatePythonScript(filenames); // Call the composite script generator

        if (pythonScriptOutput) {
            pythonScriptOutput.value = pythonScript;
        }
        if (copyScriptBtn) {
            copyScriptBtn.disabled = false; // Enable copy button
        }
        console.log("Python script generated and displayed.");
    } catch (error) {
        logError("Error generating Python script:", error);
        alert("An error occurred while generating the Python script. Check the console.");
        if (pythonScriptOutput) pythonScriptOutput.value = "Error generating script. See console for details.";
        if (copyScriptBtn) copyScriptBtn.disabled = true;
    }
}

function copyScriptToClipboard() {
    console.log("copyScriptToClipboard called.");
    if (!pythonScriptOutput || !pythonScriptOutput.value) {
         console.warn("Copy script called with no script content.");
         return;
    }

    pythonScriptOutput.select(); // Select the text
    pythonScriptOutput.setSelectionRange(0, 99999); // For mobile devices

    try {
        // Use Clipboard API if available (more modern and secure)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(pythonScriptOutput.value).then(() => {
                console.log('Script copied using Clipboard API.');
                alert('Python script copied to clipboard!');
            }).catch(err => {
                logError('Failed to copy script using Clipboard API:', err);
                // Fallback to execCommand if Clipboard API fails
                tryCopyExecCommand();
            });
        } else {
            // Fallback for older browsers or insecure contexts
            console.log('Clipboard API not available, falling back to execCommand.');
            tryCopyExecCommand();
        }
    } catch (err) {
        logError('Error invoking copy mechanism:', err);
        alert('Failed to copy script automatically. Please copy it manually.');
    } finally {
         // Deselect text after attempting copy
         if (window.getSelection) { // Standard
             window.getSelection().removeAllRanges();
         } else if (document.selection) { // IE<9
             document.selection.empty();
         }
    }
}

// Helper for execCommand fallback
function tryCopyExecCommand() {
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            console.log('Script copied using execCommand.');
            alert('Python script copied to clipboard!');
        } else {
            // execCommand can fail silently in some cases
            throw new Error('document.execCommand("copy") returned false or threw no error.');
        }
    } catch (err) {
        logError('Failed to copy script using execCommand:', err);
        alert('Failed to copy script automatically. Please copy it manually.');
    }
}


// --- Python Script Generation (Composite Style - From previous correct version) ---

function generatePythonScript(filenames) {
    // Escape backticks and dollar signs in filenames for the template literal
    const safeFilenames = filenames.map(name => name.replace(/`/g, '\\`').replace(/\$/g, '\\$'));

    // Convert the safe filenames array into a Python list string representation
    const pythonFilenamesList = `[${safeFilenames.map(name => `"${name.replace(/"/g, '\\"')}"`).join(', ')}]`; // Ensure quotes inside filenames are escaped for Python

    // --- Configuration for Composite Video ---
    const clipWidth = 480;      // Width of each individual clip frame in pixels
    const clipBorder = 10;       // Border width around each clip frame
    const borderColor = '(200, 200, 200)'; // Border color (RGB tuple as string)
    const imageDuration = 7;     // Duration for static images AND video segments in seconds
    const totalDuration = imageDuration; // Keep total duration same as segment duration for simplicity
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
SEGMENT_DURATION_SECONDS = ${imageDuration} # Duration for all segments (images/videos)
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
print(f" - Segment Duration: {SEGMENT_DURATION_SECONDS}s")
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
padding_x = 60 # Pixels horizontal padding from edge & between columns
padding_y = 60 # Pixels vertical padding from edge & between rows
available_width = TARGET_WIDTH - (cols + 1) * padding_x
available_height = TARGET_HEIGHT - (rows + 1) * padding_y
cell_width = available_width / cols if cols > 0 else available_width
cell_height = available_height / rows if rows > 0 else available_height

# Determine actual clip dimensions to fit cells (minus border)
max_clip_area_width = cell_width - 2 * CLIP_BORDER_PX
max_clip_area_height = cell_height - 2 * CLIP_BORDER_PX

# Use the smaller of the configured width or the calculated max width
final_clip_width = min(CLIP_WIDTH_PX, max_clip_area_width)
print(f"Calculated grid: {rows} rows x {cols} cols")
print(f"Grid cell approx size (WxH): {cell_width:.0f} x {cell_height:.0f} px")
print(f"Adjusted clip width to fit grid: {final_clip_width:.0f} px")

# Generate positions based on grid cell top-left corners
grid_positions_topleft = []
for r in range(rows):
    for c in range(cols):
        if len(grid_positions_topleft) < num_files: # Only generate positions for the files we have
            # Calculate top-left corner of the cell
            cell_top_left_x = padding_x + c * (cell_width + padding_x)
            cell_top_left_y = padding_y + r * (cell_height + padding_y)
            grid_positions_topleft.append({'x': cell_top_left_x, 'y': cell_top_left_y})

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
        original_width = 0
        original_height = 0

        if ext in IMAGE_EXTENSIONS:
            print(f"  Type: Image")
            clip = ImageClip(filename).set_duration(SEGMENT_DURATION_SECONDS)
            original_width, original_height = clip.size
            # Resize image based on the final calculated width, maintain aspect ratio
            clip = clip.resize(width=final_clip_width)
            print(f"  Resized Image ({original_width}x{original_height}) -> ({clip.w}x{clip.h})")
            clip = clip.set_fps(OUTPUT_FPS) # Set FPS for consistency

        elif ext in VIDEO_EXTENSIONS:
            print(f"  Type: Video")
            # Load video and resize based on width
            clip = VideoFileClip(filename, target_resolution=(None, 10000), print_cmd=False) # Load full res first
            original_width, original_height = clip.size
            clip = clip.resize(width=final_clip_width)
            print(f"  Resized Video ({original_width}x{original_height}) -> ({clip.w}x{clip.h})")
            # Trim or loop video to match the segment duration
            if clip.duration >= SEGMENT_DURATION_SECONDS:
                 print(f"  Trimming video ({clip.duration:.2f}s) to {SEGMENT_DURATION_SECONDS}s")
                 clip = clip.subclip(0, SEGMENT_DURATION_SECONDS)
            else:
                 # Looping short videos can sometimes cause issues, consider alternatives
                 # For simplicity, we'll loop here, but maybe just hold the last frame?
                 print(f"  Looping video ({clip.duration:.2f}s) to reach {SEGMENT_DURATION_SECONDS}s")
                 clip = clip.loop(duration=SEGMENT_DURATION_SECONDS)
            # Ensure FPS if needed
            if clip.fps is None or clip.fps <= 0:
                 print(f"  Warning: Video FPS invalid ({clip.fps}), setting to {OUTPUT_FPS}")
                 clip = clip.set_fps(OUTPUT_FPS)


        else:
            print(f"  WARNING: Unsupported file type: {filename} - Skipping")
            files_failed.append(f"{filename} (Unsupported type)")
            continue

        # Add border using margin
        print(f"  Adding border: {CLIP_BORDER_PX}px")
        clip = clip.margin(all=CLIP_BORDER_PX, color=BORDER_COLOR_RGB)
        print(f"  Clip size after border: {clip.w}x{clip.h}")

        # Assign position from the calculated grid cell top-left
        cell_pos = grid_positions_topleft[position_index]
        # Calculate final position to center the clip within its cell area
        pos_x = cell_pos['x'] + (cell_width - clip.w) / 2
        pos_y = cell_pos['y'] + (cell_height - clip.h) / 2

        print(f"  Assigning position (X,Y): ({pos_x:.0f}, {pos_y:.0f}) within cell {position_index}")
        clip = clip.set_position((pos_x, pos_y)) # Use absolute pixel positions

        position_index += 1


        # Set start time (for now, all start at 0)
        clip = clip.set_start(0)

        # Ensure duration is exactly the segment duration
        clip = clip.set_duration(SEGMENT_DURATION_SECONDS)

        processed_clips_for_composite.append(clip)
        files_processed.append(filename)
        print(f"  Successfully prepared: {filename}")

    except Exception as e:
        print(f"  ERROR processing file {filename}: {e}")
        print(traceback.format_exc())
        files_failed.append(f"{filename} (Processing error)")
    finally:
        # Explicitly close the clip if it was created, even if an error occurred later
        if 'clip' in locals() and clip is not None:
            try:
                clip.close() # Close individual clip to free resources
            except Exception as close_error:
                 print(f"  Error closing intermediate clip for {filename}: {close_error}")
        gc.collect() # Collect garbage after each file

print("-" * 40)

# ----------------------------------------
# 5. Create Background and Composite
# ----------------------------------------
if not processed_clips_for_composite:
    print("ERROR: No clips were successfully processed. Cannot create video.")
else:
    final_composite_clip = None # Define variable outside try block
    background_clip = None
    try:
        print("Creating background clip...")
        # Simple colored background
        background_clip = ColorClip(size=(TARGET_WIDTH, TARGET_HEIGHT),
                                    color=BACKGROUND_COLOR_RGB,
                                    ismask=False,
                                    duration=SEGMENT_DURATION_SECONDS) # Duration must match the composite


        print(f"Compositing {len(processed_clips_for_composite)} clips onto background...")
        # Layer clips onto the background. Background should be first.
        final_composite_clip = CompositeVideoClip([background_clip] + processed_clips_for_composite,
                                        size=(TARGET_WIDTH, TARGET_HEIGHT), use_bgclip=True) # use_bgclip is efficient

        # Set the duration of the final composite clip explicitly
        final_composite_clip = final_composite_clip.set_duration(SEGMENT_DURATION_SECONDS)

        print(f"Writing final composite video to: {OUTPUT_FILENAME} (This may take time)...")

        final_composite_clip.write_videofile(
            OUTPUT_FILENAME,
            fps=OUTPUT_FPS,
            codec='libx264',
            audio_codec='aac',
            preset='medium', # Adjust preset ('ultrafast' for speed, 'slow' for quality/size)
            threads=os.cpu_count(), # Use available CPU cores
            logger='bar' # Show progress bar
        )
        print("-" * 40)
        print(f"SUCCESS! Composite video saved as {OUTPUT_FILENAME}.")

    except Exception as e:
        print(f"ERROR during final compositing or export: {e}")
        print(traceback.format_exc())
    finally:
        # Clean up memory - CRUCIAL in Colab
        print("Closing final clips and collecting garbage...")
        try:
            if background_clip: background_clip.close()
        except Exception as e_close: print(f"Error closing background: {e_close}")
        # Processed clips were already closed in the loop, but clear the list
        processed_clips_for_composite.clear()
        try:
            if final_composite_clip: final_composite_clip.close()
        except Exception as e_close: print(f"Error closing final clip: {e_close}")

        # Force garbage collection again
        gc.collect()
        print("Final cleanup attempted.")


print("-" * 40)
print("Script finished.")

# Summary Report
print("\\n--- Processing Summary ---")
print(f"Total files selected originally: {len(source_filenames)}") # Use original list length
print(f"Successfully processed: {len(files_processed)}")
if files_processed: print(f"  Files: {files_processed}")
print(f"Missing files (not found in Colab): {len(files_missing)}")
if files_missing: print(f"  Files: {files_missing}")
print(f"Failed/Skipped files: {len(files_failed)}")
if files_failed: print(f"  Files: {files_failed}")
print("--------------------------")

`; // End of template literal
}

// --- Initial State Setup ---
// Run this once the script loads to ensure buttons start disabled
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed.");
    if (generateScriptBtn) generateScriptBtn.disabled = true;
    if (copyScriptBtn) copyScriptBtn.disabled = true;
});
