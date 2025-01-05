const assemblyApiKey = "915f716a9dff4c5fa7550a8543783253"; 
const huggingFaceApiKey = "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"; 

document.getElementById("uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const audioFile = document.getElementById("audioFile").files[0];
    const language = document.getElementById("language").value; 
    if (!audioFile) {
        alert("Please upload an audio file.");
        return;
    }

    document.getElementById("progressContainer").style.display = "block";
    document.getElementById("loadingText").innerText = "Processing... Please wait";
    document.getElementById("summaryContainer").style.display = "none"; 

    const transcriptionText = await transcribeWithAssemblyAI(audioFile, language);
    if (!transcriptionText) {
        alert("Failed to transcribe audio.");
        return;
    }

    const summary = await summarizeWithHuggingFace(transcriptionText);
    if (!summary) {
        alert("Failed to summarize the transcription.");
        return;
    }

    document.getElementById("summaryText").innerText = summary;
    document.getElementById("summaryContainer").style.display = "block"; 
    document.getElementById("progressContainer").style.display = "none"; 
});

async function transcribeWithAssemblyAI(audioFile, language) {
    try {
        const response = await fetch("https://api.assemblyai.com/v2/upload", {
            method: "POST",
            headers: { "authorization": assemblyApiKey },
            body: audioFile,
        });
        const uploadData = await response.json();

        const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
            method: "POST",
            headers: {
                "authorization": assemblyApiKey,
                "content-type": "application/json",
            },
            body: JSON.stringify({ audio_url: uploadData.upload_url, language_code: language }),
        });

        const transcriptData = await transcriptResponse.json();

        while (true) {
            const resultResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, {
                headers: { "authorization": assemblyApiKey },
            });
            const resultData = await resultResponse.json();

            if (resultData.status === "completed") {
                updateProgressBar(50);  
                return resultData.text;  
            } else if (resultData.status === "failed") {
                throw new Error("Transcription failed.");
            }

            await new Promise((resolve) => setTimeout(resolve, 5000)); 
            updateProgressBar(30);  
        }
    } catch (error) {
        console.error("Error with AssemblyAI:", error);
        return null;
    }
}

function updateProgressBar(percentage) {
    document.getElementById("progressBar").style.width = `${percentage}%`;
}

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
            updateProgressBar(100);  
            return data[0].summary_text; 
        } else {
            console.error("Error with Hugging Face:", await response.json());
            return null;
        }
    } catch (error) {
        console.error("Error with Hugging Face:", error);
        return null;
    }
}