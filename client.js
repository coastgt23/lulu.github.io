const ws = new WebSocket('ws://localhost:3000');

const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

let username = prompt("Enter your name (type 'ServerBot' to enable bot mode)");
let isBot = username === "ServerBot"; // Check if this client should act as the bot

// Send a message to the server
function sendMessage() {
  const messageText = messageInput.value.trim();
  if (messageText) {
    const message = { sender: username, text: messageText };
    ws.send(JSON.stringify(message));
    messageInput.value = ''; // Clear the input field
  }
}

// Display messages on the screen
function displayMessage(message) {
  const messageContainer = document.createElement('div');
  messageContainer.classList.add('message-container');

  const senderElement = document.createElement('span');
  senderElement.textContent = `${message.sender}: `;
  senderElement.classList.add('sender-name');

  const messageElement = document.createElement('span');
  messageElement.textContent = message.text;
  messageElement.classList.add('message-bubble');

  messageContainer.appendChild(senderElement);
  messageContainer.appendChild(messageElement);
  messagesDiv.appendChild(messageContainer);

  // If this is a normal client message and the bot is active, repeat it after 3 seconds
  if (isBot && message.sender !== "ServerBot") {
    setTimeout(() => {
      const botMessage = { sender: "ServerBot", text: `Echo: ${message.text}` };
      ws.send(JSON.stringify(botMessage));
    }, 3000);
  }
}

// Handle incoming WebSocket messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'history') {
    // Load previous messages
    data.messages.forEach(displayMessage);
  } else if (data.type === 'new-message') {
    // Display new message
    displayMessage(data.message);
  }
};

// Event listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

const createChannel = (channelName, passcode) => {
  const createData = {
    action: 'create-channel',
    channel: channelName,
    passcode: coastissigmadev
  };
  ws.send(JSON.stringify(createData));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'success') {
    alert(data.message);
  } else if (data.type === 'error') {
    alert(data.message);
  }
};

const settingsMenu = document.getElementById("settingsMenu");
const usernameInput = document.getElementById("usernameInput");
const pfpInput = document.getElementById("pfpInput");

// Load saved user data (if available)
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || { 
  name: "Your Name", 
  pfp: "https://via.placeholder.com/40" 
};

// Set initial values
document.getElementById("profileName").innerText = currentUser.name;
document.getElementById("profilePic").src = currentUser.pfp;
usernameInput.value = currentUser.name;
pfpInput.value = currentUser.pfp;

// Toggle settings menu
function toggleSettings() {
  settingsMenu.style.display = (settingsMenu.style.display === "block") ? "none" : "block";
}

// Save user settings
function saveSettings() {
  currentUser.name = usernameInput.value;
  currentUser.pfp = pfpInput.value;

  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // Update UI
  document.getElementById("profileName").innerText = currentUser.name;
  document.getElementById("profilePic").src = currentUser.pfp;
  
  toggleSettings();
}

// Load messages and display profile pictures
function loadMessages(channelId) {
  const messages = servers[activeServer].channels[channelId].messages || [];
  messagesDiv.innerHTML = ""; 

  messages.forEach((message) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add(message.user === currentUser.name ? "message-self" : "message-others");

    const avatar = document.createElement("img");
    avatar.classList.add("message-avatar");

    // Check if the message sender is the current user
    if (message.user === currentUser.name) {
      avatar.src = currentUser.pfp;
    } else {
      avatar.src = "https://via.placeholder.com/40"; // Default PFP for others (Can be replaced)
    }

    const messageContent = document.createElement("div");
    messageContent.classList.add("message-content");

    const messageHeader = document.createElement("div");
    messageHeader.classList.add("message-header");
    messageHeader.innerHTML = `<strong>${message.user}</strong> <span class="message-time">${message.time}</span>`;

    const messageText = document.createElement("div");
    messageText.classList.add("message-text");
    messageText.innerHTML = message.text.replace(/@\w+/g, (mention) => `<span class="mention">${mention}</span>`);

    messageContent.appendChild(messageHeader);
    messageContent.appendChild(messageText);

    if (message.media) {
      const mediaElement = document.createElement(message.media.type === "video" ? "video" : "img");
      mediaElement.src = message.media.url;
      if (message.media.type === "video") {
        mediaElement.controls = true;
        mediaElement.classList.add("message-media");
      } else {
        mediaElement.classList.add("message-media");
      }
      messageContent.appendChild(mediaElement);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    messagesDiv.appendChild(messageDiv);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to bottom
}

sendButton.addEventListener("click", () => {
  const messageText = messageInput.value;
  if (!messageText.trim()) return;

  const message = {
    user: currentUser.name,
    text: messageText,
    time: new Date().toLocaleTimeString(),
  };

  servers[activeServer].channels[activeChannel].messages.push(message);
  saveData();
  loadMessages(activeChannel);
  messageInput.value = "";
});
