const selectFilesBtn = document.getElementById('selectFilesBtn');
const fileInput = document.getElementById('fileInput');
const previewGrid = document.getElementById('previewGrid');
const generateScriptBtn = document.getElementById('generateScriptBtn');
const pythonScriptOutput = document.getElementById('pythonScriptOutput');
const fileCountSpan = document.getElementById('fileCount');
const copyScriptBtn = document.getElementById('copyScriptBtn');

let selectedFiles = []; // Array to store the actual File objects
let objectUrls = []; // To keep track of video URLs for cleanup

// --- Event Listeners ---

selectFilesBtn.addEventListener('click', () => {
    fileInput.click(); // Trigger the hidden file input
});

fileInput.addEventListener('change', handleFileSelection);

generateScriptBtn.addEventListener('click', generateAndDisplayScript);

copyScriptBtn.addEventListener('click', copyScriptToClipboard);


// --- Functions ---

function handleFileSelection(event) {
    // Clear previous previews and stored files
    clearPreviews();
    selectedFiles = Array.from(event.target.files); // Create a new array from FileList

    if (selectedFiles.length > 0) {
        displayPreviews();
        generateScriptBtn.disabled = false; // Enable script generation
         fileCountSpan.textContent = `${selectedFiles.length} file(s) selected`;
    } else {
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
    generateScriptBtn.disabled = true; // Disable button
    copyScriptBtn.disabled = true;
    pythonScriptOutput.value = '';
    fileCountSpan.textContent = `0 files selected`;
}

function generateAndDisplayScript() {
    if (selectedFiles.length === 0) {
        alert("Please select files first!");
        return;
    }

    const filenames = selectedFiles.map(file => file.name);
    const pythonScript = generatePythonScript(filenames);
    pythonScriptOutput.value = pythonScript;
    copyScriptBtn.disabled = false; // Enable copy button
}

function copyScriptToClipboard() {
    if (!pythonScriptOutput.value) return; // Nothing to copy

    pythonScriptOutput.select(); // Select the text
    pythonScriptOutput.setSelectionRange(0, 99999); // For mobile devices

    try {
        document.execCommand('copy'); // Attempt to copy
        alert('Python script copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy script: ', err);
        alert('Failed to copy script automatically. Please copy it manually.');
    }
     window.getSelection().removeAllRanges(); // Deselect
}

// --- Python Script Generation ---

function generatePythonScript(filenames) {
    // Escape backticks and dollar signs in filenames for the template literal
    const safeFilenames = filenames.map(name => name.replace(/`/g, '\\`').replace(/\$/g, '\\$'));

    // Convert the safe filenames array into a Python list string representation
    const pythonFilenamesList = `[${safeFilenames.map(name => `"${name.replace(/"/g, '\\"')}"`).join(', ')}]`; // Ensure quotes inside filenames are escaped for Python

    // --- Configuration ---
    const imageDuration = 5; // Default duration for images in seconds
    const targetHeight = 1080; // Target resolution (height)
    const outputFps = 30;     // Frames per second for the output video
    const outputFilename = "output_1080p.mp4";
    // ---

    // Use template literals for the Python script
    return `
# Python Script for Google Colab Video Generation
# Generated by Web Preview App

# IMPORTANT: Before running, upload the EXACT SAME files listed below
#            to your Colab session's file directory!

# ----------------------------------------
# 1. Setup Environment
# ----------------------------------------
print("Installing necessary libraries...")
!pip install moviepy==1.0.3 # Using a specific version for stability
print("Installation complete.")
print("-" * 40)

# ----------------------------------------
# 2. Import Libraries
# ----------------------------------------
import os
from moviepy.editor import *
import traceback # For better error reporting

print("Libraries imported.")
print("-" * 40)

# ----------------------------------------
# 3. Configuration (Edit if needed)
# ----------------------------------------
# List of filenames (MUST MATCH UPLOADED FILES)
source_filenames = ${pythonFilenamesList}

IMAGE_DURATION_SECONDS = ${imageDuration}
TARGET_HEIGHT = ${targetHeight} # Output video height (1080p)
OUTPUT_FPS = ${outputFps}
OUTPUT_FILENAME = "${outputFilename}"

# Add more extensions if needed (case-insensitive)
IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif']
VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm']

print("Configuration:")
print(f" - Source Files: {len(source_filenames)} items")
print(f" - Image Duration: {IMAGE_DURATION_SECONDS}s")
print(f" - Target Height: {TARGET_HEIGHT}px")
print(f" - Output FPS: {OUTPUT_FPS}")
print(f" - Output Filename: {OUTPUT_FILENAME}")
print("-" * 40)

# ----------------------------------------
# 4. Processing Logic
# ----------------------------------------
processed_clips = []
files_missing = []
files_processed = []
files_failed = []

print("Starting processing...")

for filename in source_filenames:
    print(f"Processing: {filename}...")
    if not os.path.exists(filename):
        print(f"  ERROR: File not found in Colab environment: {filename}")
        files_missing.append(filename)
        continue # Skip to the next file

    try:
        _, ext = os.path.splitext(filename.lower()) # Get lowercased extension
        clip = None

        if ext in IMAGE_EXTENSIONS:
            print(f"  Type: Image")
            clip = ImageClip(filename).set_duration(IMAGE_DURATION_SECONDS)
            # If image is smaller than target height, resize it up.
            # If larger, resize it down. Maintain aspect ratio.
            if clip.h != TARGET_HEIGHT:
                 print(f"  Resizing image height to {TARGET_HEIGHT}px (aspect preserved)")
                 clip = clip.resize(height=TARGET_HEIGHT)
            # Ensure images have an FPS suitable for video concatenation
            clip = clip.set_fps(OUTPUT_FPS)

        elif ext in VIDEO_EXTENSIONS:
            print(f"  Type: Video")
            clip = VideoFileClip(filename, target_resolution=(TARGET_HEIGHT, None)) # Resize height directly on load
            if clip.fps is None: # Handle potential missing FPS metadata
                print("  Warning: Video FPS not found, assuming default:", OUTPUT_FPS)
                clip = clip.set_fps(OUTPUT_FPS)
            # Ensure audio is compatible (optional but good practice)
            # clip = clip.set_audio(clip.audio.set_fps(44100)) # Example - adjust if needed

        else:
            print(f"  WARNING: Unsupported file type: {filename} - Skipping")
            files_failed.append(f"{filename} (Unsupported type)")
            continue

        # Ensure clip has audio track even if image to prevent issues later
        if clip.audio is None and isinstance(clip, ImageClip):
            print("  Adding silent audio track to image clip")
            clip = clip.set_audio(AudioClip(lambda t: 0, duration=clip.duration, fps=44100))


        # Double-check resize for videos that might not have been resized on load
        if isinstance(clip, VideoClip) and clip.h != TARGET_HEIGHT:
             print(f"  Resizing video height to {TARGET_HEIGHT}px (aspect preserved)")
             clip = clip.resize(height=TARGET_HEIGHT)


        processed_clips.append(clip)
        files_processed.append(filename)
        print(f"  Successfully processed: {filename}")

    except Exception as e:
        print(f"  ERROR processing file {filename}: {e}")
        print(traceback.format_exc()) # Print detailed error
        files_failed.append(f"{filename} (Processing error)")

print("-" * 40)

# ----------------------------------------
# 5. Concatenate and Export
# ----------------------------------------
if not processed_clips:
    print("ERROR: No clips were successfully processed. Cannot create video.")
    if files_missing:
        print("\\nFiles listed above were MISSING. Please upload them and try again.")
else:
    print(f"Concatenating {len(processed_clips)} processed clips...")
    try:
        final_clip = concatenate_videoclips(processed_clips, method="compose")

        print(f"Writing final video to: {OUTPUT_FILENAME} (This may take some time)...")
        # Use 'libx264' for wide compatibility, 'aac' for audio
        final_clip.write_videofile(
            OUTPUT_FILENAME,
            fps=OUTPUT_FPS,
            codec='libx264',
            audio_codec='aac',
            preset='medium', # encoding speed vs compression (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
            threads=4 # Use multiple threads if available in Colab
        )
        print("-" * 40)
        print(f"SUCCESS! Video saved as {OUTPUT_FILENAME} in the Colab file browser.")

        # Clean up memory (important in Colab)
        print("Closing clips...")
        for clip in processed_clips:
          try:
            clip.close()
          except:
            pass # Ignore errors during cleanup
        try:
          final_clip.close()
        except:
            pass

    except Exception as e:
        print(f"ERROR during final concatenation or export: {e}")
        print(traceback.format_exc())

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