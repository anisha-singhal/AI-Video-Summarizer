const assemblyApiKey = "915f716a9dff4c5fa7550a8543783253";  // Replace with your AssemblyAI API key
const huggingFaceApiKey = "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";  // Replace with your Hugging Face API key

document.getElementById("uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const audioFile = document.getElementById("audioFile").files[0];
    const language = document.getElementById("language").value; // Get selected language
    if (!audioFile) {
        alert("Please upload an audio file.");
        return;
    }

    // Show progress bar and processing text
    document.getElementById("progressContainer").style.display = "block";
    document.getElementById("loadingText").innerText = "Processing... Please wait";
    document.getElementById("summaryContainer").style.display = "none"; // Hide summary container initially

    // Transcribe audio with AssemblyAI
    const transcriptionText = await transcribeWithAssemblyAI(audioFile, language);
    if (!transcriptionText) {
        alert("Failed to transcribe audio.");
        return;
    }

    // Summarize the transcription with Hugging Face
    const summary = await summarizeWithHuggingFace(transcriptionText);
    if (!summary) {
        alert("Failed to summarize the transcription.");
        return;
    }

    // Only show the summary, transcription will not be displayed
    document.getElementById("summaryText").innerText = summary;
    document.getElementById("summaryContainer").style.display = "block"; // Show summary container
    document.getElementById("progressContainer").style.display = "none"; // Hide progress bar after completion
});

// Function to transcribe audio with AssemblyAI
async function transcribeWithAssemblyAI(audioFile, language) {
    try {
        // Upload the audio file
        const response = await fetch("https://api.assemblyai.com/v2/upload", {
            method: "POST",
            headers: { "authorization": assemblyApiKey },
            body: audioFile,
        });
        const uploadData = await response.json();

        // Send the file URL for transcription with the selected language
        const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
            method: "POST",
            headers: {
                "authorization": assemblyApiKey,
                "content-type": "application/json",
            },
            body: JSON.stringify({ audio_url: uploadData.upload_url, language_code: language }),
        });

        const transcriptData = await transcriptResponse.json();

        // Poll for the transcription result
        while (true) {
            const resultResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, {
                headers: { "authorization": assemblyApiKey },
            });
            const resultData = await resultResponse.json();

            if (resultData.status === "completed") {
                updateProgressBar(50);  // Update progress (after transcription)
                return resultData.text;  // Return transcription for summarization
            } else if (resultData.status === "failed") {
                throw new Error("Transcription failed.");
            }

            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
            updateProgressBar(30);  // Update progress (while waiting for transcription)
        }
    } catch (error) {
        console.error("Error with AssemblyAI:", error);
        return null;
    }
}

// Function to update progress bar
function updateProgressBar(percentage) {
    document.getElementById("progressBar").style.width = `${percentage}%`;
}

// Function to summarize text with Hugging Face
async function summarizeWithHuggingFace(text) {
    const summaryApiUrl = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
    const prompt = { inputs: text };

    try {
        const response = await fetch(summaryApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${huggingFaceApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(prompt),
        });

        if (response.ok) {
            const data = await response.json();
            updateProgressBar(100);  // Final update of the progress bar (completion)
            return data[0].summary_text;  // Return only the summary text
        } else {
            console.error("Error with Hugging Face:", await response.json());
            return null;
        }
    } catch (error) {
        console.error("Error with Hugging Face:", error);
        return null;
    }
}



// const assemblyApiKey = "915f716a9dff4c5fa7550a8543783253";  // Replace with your AssemblyAI API key
// const huggingFaceApiKey = "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";  // Replace with your Hugging Face API key

// document.getElementById("uploadForm").addEventListener("submit", async (event) => {
//     event.preventDefault();

//     const audioFile = document.getElementById("audioFile").files[0];
//     if (!audioFile) {
//         alert("Please upload an audio file.");
//         return;
//     }

//     // Show progress bar
//     document.getElementById("progressContainer").style.display = "block";

//     // Transcribe audio with AssemblyAI
//     const transcriptionText = await transcribeWithAssemblyAI(audioFile);
//     if (!transcriptionText) {
//         alert("Failed to transcribe audio.");
//         return;
//     }

//     // Summarize the transcription with Hugging Face
//     const summary = await summarizeWithHuggingFace(transcriptionText);
//     if (!summary) {
//         alert("Failed to summarize the transcription.");
//         return;
//     }

//     // Only show the summary, transcription will not be displayed
//     document.getElementById("summaryText").innerText = summary;
// });

// // Function to transcribe audio with AssemblyAI
// async function transcribeWithAssemblyAI(audioFile) {
//     try {
//         // Upload the audio file
//         const response = await fetch("https://api.assemblyai.com/v2/upload", {
//             method: "POST",
//             headers: { "authorization": assemblyApiKey },
//             body: audioFile,
//         });
//         const uploadData = await response.json();

//         // Send the file URL for transcription
//         const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
//             method: "POST",
//             headers: {
//                 "authorization": assemblyApiKey,
//                 "content-type": "application/json",
//             },
//             body: JSON.stringify({ audio_url: uploadData.upload_url }),
//         });

//         const transcriptData = await transcriptResponse.json();

//         // Poll for the transcription result
//         while (true) {
//             const resultResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, {
//                 headers: { "authorization": assemblyApiKey },
//             });
//             const resultData = await resultResponse.json();

//             if (resultData.status === "completed") {
//                 updateProgressBar(50);  // Update progress
//                 return resultData.text;  // Return transcription for summarization
//             } else if (resultData.status === "failed") {
//                 throw new Error("Transcription failed.");
//             }

//             await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds
//             updateProgressBar(30);  // Update progress
//         }
//     } catch (error) {
//         console.error("Error with AssemblyAI:", error);
//         return null;
//     }
// }

// // Function to update progress bar
// function updateProgressBar(percentage) {
//     document.getElementById("progressBar").style.width = `${percentage}%`;
// }

// // Function to summarize text with Hugging Face
// async function summarizeWithHuggingFace(text) {
//     const summaryApiUrl = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
//     const prompt = { inputs: text };

//     try {
//         const response = await fetch(summaryApiUrl, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${huggingFaceApiKey}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(prompt),
//         });

//         if (response.ok) {
//             const data = await response.json();
//             updateProgressBar(100);  // Final update of the progress bar
//             return data[0].summary_text;  // Return only the summary text
//         } else {
//             console.error("Error with Hugging Face:", await response.json());
//             return null;
//         }
//     } catch (error) {
//         console.error("Error with Hugging Face:", error);
//         return null;
//     }
// }
