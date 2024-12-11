// Establishes a connection to the socket.io server
const socket = io("/");
const { jsPDF } = window.jspdf;
// DOM elements for the chat window, video grids, and chat input
const main__chat__window = document.getElementById("main__chat_window");
const videoGrids = document.getElementById("video-grids");
const myVideo = document.createElement("video"); // Creates a video element for the local stream
const chat = document.getElementById("chat");
let OtherUsername = ""; // Stores the username of the other user
chat.hidden = true; // Initially hides the chat box
myVideo.muted = true; // Mutes local video by default

let apiKey;

// Fetch the API Key from the server
fetch('/api/config')
    .then((response) => response.json())
    .then((config) => {
        apiKey = config.apiKey; // Store the API key
        console.log('API Key:', apiKey); // Use it here, or store it for later use

      
    })
    .catch((error) => console.error('Error fetching config:', error));

// Shows a modal on page load using jQuery
window.onload = () => {
    $(document).ready(function() {
        $("#getCodeModal").modal("show");
    });
};
// let isDragging = false;
// let currentX;
// let currentY;
// let initialX;
// let initialY;
// let xOffset = 0;
// let yOffset = 0;
// let xPosition = 0;
// let yPosition = 0;

// const resultModal = document.getElementById("resultModal");

// resultModal.addEventListener("mousedown", dragStart);
// resultModal.addEventListener("mouseup", dragEnd);
// resultModal.addEventListener("mousemove", drag);

// function dragStart(e) {
//     initialX = e.clientX - xOffset;
//     initialY = e.clientY - yOffset;

//     if (e.target === resultModal) {
//         isDragging = true;
//     }
// }

// function dragEnd(e) {
//     initialX = currentX;
//     initialY = currentY;

//     isDragging = false;
// }

// function drag(e) {
//     if (isDragging) {
//         e.preventDefault();

//         if (e.type === "mousemove") {
//             currentX = e.clientX - initialX;
//             currentY = e.clientY - initialY;

//             xOffset = currentX;
//             yOffset = currentY;

//             setTranslate(currentX, currentY, resultModal);
//         }
//     }
// }

// function setTranslate(xPos, yPos, el) {
//     el.style.transform = `translate(${xPos}px, ${yPos}px)`;
// }
// PeerJS configuration for WebRTC connections
var peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "3030",
});

// Global variables for user media stream and connected peers
let myVideoStream;
const peers = {};
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// Sends a chat message when the "Enter" key is pressed
sendmessage = (text) => {
    if (event.key === "Enter" && text.value != "") {
      console.log(myname);
        socket.emit("messagesend", myname + ' : ' + text.value); // Sends the message to the server
        text.value = ""; // Clears the input box
        main__chat__window.scrollTop = main__chat__window.scrollHeight; // Scrolls to the bottom of the chat
    }
};

// Requests access to the user's camera and microphone
navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {
        myVideoStream = stream; // Stores the local media stream
        addVideoStream(myVideo, stream, myname); // Displays the local video

        // Listens for a new user connecting to the room
        socket.on("user-connected", (id, username) => {
            console.log("userid:" + id);
            connectToNewUser(id, stream, username); // Connects to the new user
            socket.emit("tellName", myname); // Sends the user's name to the server
        });

        // Listens for a user disconnecting from the room
        socket.on("user-disconnected", (id) => {
            console.log(peers);
            if (peers[id]) peers[id].close(); // Closes the WebRTC connection with the disconnected user
        });
    });

// Handles incoming calls from other users
peer.on("call", (call) => {
    getUserMedia(
        { video: true, audio: true },
        (stream) => {
            call.answer(stream); // Answers the call with the local media stream
            const video = document.createElement("video");
            call.on("stream", (remoteStream) => {
                addVideoStream(video, remoteStream, OtherUsername); // Displays the remote video stream
            });
        },
        (err) => {
            console.log("Failed to get local stream", err);
        }
    );
});

// Emits the user's ID and name when the PeerJS connection opens
peer.on("open", (id) => {
    socket.emit("join-room", roomId, id, myname);
});

// Adds a chat message to the DOM
socket.on("createMessage", (message) => {
    var ul = document.getElementById("messageadd");
    var li = document.createElement("li");
    li.className = "message";
    li.appendChild(document.createTextNode(message));
    ul.appendChild(li);
});

// Receives and stores the username of the other user
socket.on("AddName", (username) => {
    OtherUsername = username;
    console.log(username);
});

// Removes unused video elements from the DOM
const RemoveUnusedDivs = () => {
    const alldivs = videoGrids.getElementsByTagName("div");
    for (var i = 0; i < alldivs.length; i++) {
        const e = alldivs[i].getElementsByTagName("video").length;
        if (e == 0) {
            alldivs[i].remove();
        }
    }
};

// Connects to a new user and adds their video stream
const connectToNewUser = (userId, streams, myname) => {
    const call = peer.call(userId, streams); // Initiates a call to the new user
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, myname); // Displays the new user's video stream
    });
    call.on("close", () => {
        video.remove(); // Removes the video element when the call ends
        RemoveUnusedDivs(); // Cleans up unused divs
    });
    peers[userId] = call; // Stores the call in the peers object
};

// Hides the invite modal
const cancel = () => {
    $("#getCodeModal").modal("hide");
};

// Copies the room link to the clipboard
const copy = async () => {
    const roomid = document.getElementById("roomid").innerText;
    await navigator.clipboard.writeText("http://localhost:3030/join/" + roomid);
};

// Shows the invite modal
const invitebox = () => {
    $("#getCodeModal").modal("show");
};

// Toggles the microphone on or off
const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        document.getElementById("mic").style.color = "red";
    } else {
        document.getElementById("mic").style.color = "white";
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

// Toggles the video on or off
const VideomuteUnmute = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        document.getElementById("video").style.color = "red";
    } else {
        document.getElementById("video").style.color = "white";
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

// Shows or hides the chat box
const showchat = () => {
    chat.hidden = !chat.hidden;
};

// Adds a video stream to the DOM
const addVideoStream = (videoEl, stream, name) => {
    videoEl.srcObject = stream;
    videoEl.addEventListener("loadedmetadata", () => {
        videoEl.play();
    });
    const h1 = document.createElement("h1");
    h1.appendChild(document.createTextNode(name));
    const videoGrid = document.createElement("div");
    videoGrid.classList.add("video-grid");
    videoGrid.appendChild(h1);
    videoGrids.appendChild(videoGrid);
    videoGrid.append(videoEl);
    RemoveUnusedDivs(); // Removes unused divs
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
        for (let index = 0; index < totalUsers; index++) {
            document.getElementsByTagName("video")[index].style.width =
                100 / totalUsers + "%";
        }
    }
};

// Recording functionality
let mediaRecorder;
let audioChunks = [];

// Starts recording audio
const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            const audioURL = URL.createObjectURL(audioBlob);
            const downloadLink = document.createElement("a");
            downloadLink.href = audioURL;
            downloadLink.download = "recording.webm";
            downloadLink.textContent = "Download Recording";
            document.getElementById("recording-container").appendChild(downloadLink);
            audioChunks = [];
        };
        mediaRecorder.start();
        console.log("Recording started...");
    } catch (err) {
        console.error("Error accessing microphone:", err);
    }
};

// Stops the audio recording and send to openai api. Handle reponse received
const stopRecording = async () => {

    let transcript =""; let summary = "";
    let peopleWiseSummary = "";
    function showResultModal() {
       
        document.getElementById('resultModal').style.display = 'block';
        document.getElementById('loadingText').style.display = 'block';
      
    }
    
    // Function to close the modal
    
    showResultModal();

    setTimeout(() => {
        // Assuming transcript, summary, and people-wise summary are fetched from some source
        
        // Hide loading text and show options
       
        document.getElementById('summaryOptions').style.display = 'block';
        console.log(transcript);
        // You can assign the fetched content to each button or handle them as needed
        document.getElementById('loadingText').textContent = 'Processing Completed!!';
        
    }, 10000);
    document.getElementById('loadingText').textContent = 'Generating Summaries...';
 // Function to download content as PDF
 function downloadAsPDF(content, fileName) {
  const doc = new jsPDF();
  const margin = 15; // Margin from the edges of the PDF
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxLineWidth = pageWidth - margin * 2; // Width available for text
  const lineHeight = 7; // Height of each line (smaller for professional look)
  let cursorY = margin; // Start at top margin

  // Set font style and size
  doc.setFont("Times", "normal");
  doc.setFontSize(12); // Smaller, professional font size

  // Split content into lines that fit within maxLineWidth
  const lines = doc.splitTextToSize(content, maxLineWidth);

  // Add lines to the PDF, moving the cursor down for each line
  lines.forEach((line) => {
      if (cursorY + lineHeight > pageHeight - margin) {
          // Add a new page if the current page is full
          doc.addPage();
          cursorY = margin; // Reset Y position
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight; // Move to the next line
  });

  doc.save(fileName); // Download the PDF
}

document.getElementById('transcriptBtn').addEventListener("click", () => {
  console.log(transcript);
  document.getElementById('loadingText').textContent = transcript;

  // Add download button for PDF
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download Transcript as PDF';
  downloadBtn.style.display = 'block';
  downloadBtn.style.backgroundColor = 'blue';
  downloadBtn.style.color = 'white';
  downloadBtn.style.marginTop = '1rem';
  downloadBtn.style.padding = '0.5rem';
  downloadBtn.style.borderRadius = '1rem';
  downloadBtn.style.cursor = 'pointer';

  downloadBtn.addEventListener('click', () => {
      downloadAsPDF(transcript, 'transcript.pdf');
  });

  document.getElementById('loadingText').appendChild(downloadBtn);
});

document.getElementById('summaryBtn').addEventListener("click", () => {
  document.getElementById('loadingText').textContent = summary;

  // Add download button for PDF
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download Summary as PDF';
  downloadBtn.style.display = 'block';
  downloadBtn.style.backgroundColor = 'blue';
  downloadBtn.style.color = 'white';
  downloadBtn.style.marginTop = '1rem';
  downloadBtn.style.padding = '0.5rem';
  downloadBtn.style.borderRadius = '1rem';
  downloadBtn.style.cursor = 'pointer';

  downloadBtn.addEventListener('click', () => {
      downloadAsPDF(summary, 'summary.pdf');
  });

  document.getElementById('loadingText').appendChild(downloadBtn);
});

document.getElementById('peopleWiseSummaryBtn').addEventListener("click", () => {
  console.log(peopleWiseSummary);
  document.getElementById('loadingText').textContent = peopleWiseSummary;

  // Add download button for PDF
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download People-Wise Summary as PDF';
  downloadBtn.style.display = 'block';
  downloadBtn.style.backgroundColor = 'blue';
  downloadBtn.style.color = 'white';
  downloadBtn.style.marginTop = '1rem';
  downloadBtn.style.padding = '0.5rem';
  downloadBtn.style.borderRadius = '1rem';
  downloadBtn.style.cursor = 'pointer';
  downloadBtn.addEventListener('click', () => {
      downloadAsPDF(peopleWiseSummary, 'people_wise_summary.pdf');
  });

  document.getElementById('loadingText').appendChild(downloadBtn);
});

  if (mediaRecorder) {
    mediaRecorder.stop();
    console.log("[Recording] Stop method initiated");

    mediaRecorder.onstop = async () => {
      try {
        // Combine the audio chunks into a Blob
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        console.log("[Audio Processing] Blob created", {
          blobSize: audioBlob.size,
          type: audioBlob.type
        });

        // Prepare the audio file for API upload
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");
        formData.append("model", "whisper-1");
        console.log("[Whisper API] Form data prepared for transcription");

        // OpenAI API key (IMPORTANT: NEVER hardcode API keys in production!)
        const openaiApiKey = apiKey;
        // Step 1: Transcribe the audio using Whisper API
        const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`
          },
          body: formData
        });

        if (!transcriptionResponse.ok) {
          throw new Error("Transcription API error");
        }

        // Get the transcription text
        const transcriptionResult = await transcriptionResponse.json();
        const transcriptionText = transcriptionResult.text;
        transcript = transcriptionText;
        console.log("[Transcription] Raw transcript received", {
          transcriptLength: transcriptionText.length,
          wordCount: transcriptionText.split(/\s+/).length
        });

        // Step 2: Preprocess transcript to identify potential speakers
        peopleWiseSummary = await preprocessTranscript(transcriptionText, openaiApiKey);
        console.log("[Preprocessing] Transcript processed for speaker identification", {
          processedTranscriptLength: peopleWiseSummary.length
        });

        // Step 3: Generate a summary using GPT-3.5 with speaker insights
        const summaryResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo-16k",
            messages: [
              {
                role: "system",
                content: `You are an expert meeting summarizer. Carefully analyze the preprocessed transcript 
                and provide:
                1. Main discussion points
                2. Decisions and action items
                3. Overall meeting context`
              },
              {
                role: "user",
                content: `Preprocessed Meeting Transcript:
${transcriptionText}

Please provide a comprehensive summary with detailed speaker insights.`
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          })
        });

        if (!summaryResponse.ok) {
          throw new Error("Summary Generation API error");
        }

        // Parse the summary result
        const summaryResult = await summaryResponse.json();
        const meetingSummary = summaryResult.choices[0].message.content;
        
        console.log("[Summary Generation] Meeting summary created", {
          summaryLength: meetingSummary.length,
          summaryWordCount: meetingSummary.split(/\s+/).length
        });

        // Detailed logging of final results
        console.log("===== MEETING TRANSCRIPT =====");
        console.log(transcriptionText);
        console.log("===== MEETING SUMMARY =====");
        console.log(meetingSummary);
        transcript = transcriptionText;
        summary = meetingSummary;
        // Optional: Return or display results
        return {
          transcript,
          summary
        };

      } catch (error) {
        console.error("[Error] Comprehensive error logging", {
          errorMessage: error.message,
          errorStack: error.stack,
          timestamp: new Date().toISOString()
        });

        // Optionally rethrow or handle the error
        throw error;
      } finally {
        // Clear audio chunks for the next recording
        audioChunks = [];
        console.log("[Cleanup] Audio chunks reset");
      }
    };
  } else {
    console.warn("[Recording] No media recorder found");
  }
};
summary = summaryResponse.summary;
// Helper function to preprocess and attempt speaker identification
async function preprocessTranscript(transcript, apiKey) {
  console.log("[Speaker Identification] Starting preprocessing");

  try {
    const speakerDetectionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Analyze the transcript and help identify distinct speakers. 
            Add labels like [Speaker A], [Speaker B], etc., before their respective dialogues.
            If speaker distinction is challenging, return the original transcript.`
          },
          {
            role: "user",
            content: `Identify speakers in this transcript:
${transcript}`
          }
        ],
        max_tokens: 300,
        temperature: 0.5
      })
    });

    if (!speakerDetectionResponse.ok) {
      console.warn("[Speaker Identification] Detection API call failed");
      return transcript;
    }

    const speakerDetectionResult = await speakerDetectionResponse.json();
    const processedTranscript = speakerDetectionResult.choices[0].message.content;
    console.log(processedTranscript);
    console.log("[Speaker Identification] Preprocessing complete", {
      originalLength: transcript.length,
      processedLength: processedTranscript.length
    });
     peopleWiseSummary = processedTranscript;
     console.log(peopleWiseSummary);
    return peopleWiseSummary;
  } catch (error) {
    console.error("[Speaker Identification] Preprocessing error", {
      errorMessage: error.message
    });
    return transcript;
  }
  


}
