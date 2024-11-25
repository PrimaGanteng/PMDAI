// Initialize a variable to track the current bot
let useGpt4 = false; // Start with LuminAI as the default bot

// Event listener for the send button
document.getElementById('sendButton').addEventListener('click', sendMessage);

// Event listener for handling keypress on input
document.getElementById('userInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default Enter behavior
        if (event.ctrlKey) {
            // If Ctrl + Enter is pressed, add a new line
            const userInput = document.getElementById('userInput');
            userInput.value += '\n'; // Add a new line
        } else {
            // If only Enter is pressed, send the message
            sendMessage(); // Call function to send message
        }
    }
});

let recognition;
let isRecording = false;

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true; // Continuous recording
    recognition.interimResults = false; // Only final results

    recognition.onresult = function(event) {
        const transcript = event.results[event.results.length - 1][0].transcript; // Get text from results
        document.getElementById('userInput').value = transcript; // Insert text into input
        sendMessage(); // Automatically send the message
    };

    recognition.onerror = function(event) {
        console.error('Error occurred in recognition: ' + event.error);
        isRecording = false; // Reset recording state
        updateRecordingIcon(); // Reset icon
    };

    recognition.onend = function() {
        // Automatically reset recording state when recognition ends naturally
        if (isRecording) {
            isRecording = false;
            updateRecordingIcon(); // Reset icon
        }
    };
}

// Event listener for the recording button
document.getElementById('toggleRecording').addEventListener('click', function() {
    if (!isRecording) {
        recognition.start(); // Start voice recognition
        isRecording = true; // Update the recording state
        updateRecordingIcon(); // Update icon to stop
    } else {
        recognition.stop(); // Stop voice recognition
        // Update the recording state immediately
        isRecording = false; 
        updateRecordingIcon(); // Update icon to microphone
    }
});

// Function to update the recording button icon
function updateRecordingIcon() {
    const toggleRecordingButton = document.getElementById('toggleRecording');
    toggleRecordingButton.innerHTML = isRecording 
        ? '<i class="fas fa-stop"></i>' // Change to stop icon when recording
        : '<i class="fa fa-microphone"></i>'; // Change back to microphone icon when not recording
}

// Event listener for the switch bot AI button
document.getElementById('switchBotButton').addEventListener('click', function() {
    const botName = useGpt4 ? "PMD AI" : "PMD AI 2.0";
    const message = useGpt4 ? "Apakah Anda ingin mengganti ke PMD AI?" : "Apakah Anda ingin mengganti ke PMD AI 2.0?";
    
    // Display popup with appropriate message
    document.getElementById('popupMessage').innerText = message;
    const popup = document.getElementById('botSwitchPopup');
    popup.style.display = 'block'; // Show popup
    popup.style.opacity = 1; // Set opacity to 1 for fade-in effect

    // Event listener for the change button
    document.getElementById('changeButton').onclick = function() {
        useGpt4 = !useGpt4; // Toggle the bot usage
        const newBotName = useGpt4 ? "PMD AI 2.0" : "PMD AI";
        console.log(`Switched to ${newBotName}!`); // Log bot change

        // Hide popup with fade out effect
        let fadeEffect = setInterval(function () {
            if (popup.style.opacity > 0) {
                popup.style.opacity -= 0.1; // Decrease opacity
            } else {
                clearInterval(fadeEffect);
                popup.style.display = 'none'; // Hide popup after fade out
            }
        }, 50); // Interval time for animation
    };
});

function sendMessage() {
    const userInput = document.getElementById('userInput').value.trim();
    const messagesDiv = document.getElementById('messages');

 if (userInput === "") return; // Prevent sending empty messages

    // Stop voice recognition if it's active
    if (isRecording) {
        recognition.stop(); // Stop the voice recognition
        isRecording = false; // Update the recording state immediately
        updateRecordingIcon(); // Update icon to microphone
    }

    // Display user message
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user-message';
    userMessageDiv.innerText = userInput;
    messagesDiv.appendChild(userMessageDiv);
    document.getElementById('userInput').value = ''; // Clear input after sending

    // Trigger animation for user message
    setTimeout(() => {
        userMessageDiv.style.opacity = 1;
        userMessageDiv.style.transform = 'translateY(0)';
    }, 30); // Delay for CSS transition

    // Scroll to the latest user message
    userMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // Display loading message with typing indicator in the bot message area
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message loading'; // Use bot-message class for styling
    loadingMessage.innerHTML = `
        <div class="typing-indicator">
            <div></div>
            <div></div>
            <div></div>
        </div>
    `;
    messagesDiv.appendChild(loadingMessage);
    loadingMessage.scrollIntoView({ behavior: 'smooth', block: 'end' }); // Focus on loading message

    // Send message to the server
    fetch(`${window.location.origin}/api/ask`, { // Using dynamic URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            message: userInput,
            username: 'defaultUser  ', // Replace with actual username if needed
            useGpt4: useGpt4 // Include flag to determine which bot to use
        }),
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Network response was not ok');
    })
    .then(data => {
        console.log('Data from API:', data); // Log entire data to check structure
    
        // Remove loading message with fade-out effect
        messagesDiv.removeChild(loadingMessage);
    
        // Display AI response
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'message bot-message'; // Menggunakan kelas bot-message
    
        // Ensure you access the correct properties from the response object
        if (data.reply) {
            aiMessageDiv.innerText = data.reply; // Access reply property
        } else if (data.data && data.data.reply) {
            aiMessageDiv.innerText = data.data.reply; // Access nested reply property
        } else {
            aiMessageDiv.innerText = 'Tidak ada jawaban dari AI.'; // Default message
        }
    
        messagesDiv.appendChild(aiMessageDiv);
    
        // Trigger animation for AI message
        setTimeout(() => {
            aiMessageDiv.style.opacity = 1;
            aiMessageDiv.style.transform = 'translateY(0)';
        }, 10); // Delay for CSS transition
    
        // Scroll to the latest AI message
        setTimeout(() => {
            aiMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            const offset = 40; // Offset for scroll position
            const elementPosition = aiMessageDiv.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - offset;
    
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }, 100); // Delay for rendering message

        // If the user was using voice recognition, restart it
        if (isRecording) {
            recognition.start(); // Restart voice recognition
        }
    })
    .catch(error => {
        console.error('Error occurred:', error);
        messagesDiv.removeChild(loadingMessage);
        
        // Display error message
        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.className = 'message ai-message';
        errorMessageDiv.innerText = `Terjadi kesalahan saat menghubungi AI: ${error.message}`;
        messagesDiv.appendChild(errorMessageDiv);

        // Trigger animation for error message
        setTimeout(() => {
            errorMessageDiv.style.opacity = 1;
            errorMessageDiv.style.transform = 'translateY(0)';
        }, 10); // Delay for CSS transition

        // Scroll down to show error message
        errorMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });

        // Keep focus on the input field
        document.getElementById('userInput').focus(); // Return focus to input field
    });

    // Do not clear input after sending
    // Maintain focus on the recording button if in voice mode
    if (isRecording) {
        updateRecordingIcon(); // Ensure icon is set to stop
        document.getElementById('toggleRecording').focus(); // Return focus to recording button
    } else {
        updateRecordingIcon(); // Ensure icon is set to microphone
    }
}