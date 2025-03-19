const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const mediaInput = document.getElementById("mediaInput");
const usernameInput = document.getElementById("username");
const pfpInput = document.getElementById("pfpInput");
const pfpPreview = document.getElementById("pfpPreview");
const saveSettingsButton = document.getElementById("saveSettings");
const themeToggle = document.getElementById("themeToggle");
const settingsButton = document.getElementById("settingsButton");
const settingsPanel = document.getElementById("settingsPanel");
const overlay = document.getElementById("overlay");
const clearChatButton = document.getElementById("clearChatButton");

const ws = new WebSocket("ws://localhost:3000"); // WebSocket connection

// Load settings
let username = localStorage.getItem("username") || prompt("Enter your name:");
if (!username) username = "Anonymous";
localStorage.setItem("username", username);
usernameInput.value = username;

let profilePic = localStorage.getItem("profilePic") || "";
const darkMode = localStorage.getItem("darkMode") === "true";
document.body.classList.toggle("dark", darkMode);
themeToggle.checked = darkMode;

// Display Profile Picture Preview
function displayProfilePic() {
  pfpPreview.src = profilePic || "default-pfp.jpg";
}

// Handle Profile Picture Upload
pfpInput.addEventListener("change", function (event) {
  const reader = new FileReader();
  reader.onload = function (e) {
    localStorage.setItem("profilePic", e.target.result);
    profilePic = e.target.result;
    displayProfilePic();

    // Send profile picture update to server
    ws.send(JSON.stringify({ type: "updatePfp", username, pfp: profilePic }));
  };
  reader.readAsDataURL(event.target.files[0]);
});

// Set initial profile picture
displayProfilePic();

// Toggle settings menu visibility
settingsButton.addEventListener("click", () => {
  settingsPanel.classList.toggle("visible");
  overlay.classList.toggle("hidden");
});

// Hide settings menu when overlay is clicked
overlay.addEventListener("click", () => {
  settingsPanel.classList.remove("visible");
  overlay.classList.add("hidden");
});

// Save settings
saveSettingsButton.addEventListener("click", () => {
  localStorage.setItem("username", usernameInput.value);
  localStorage.setItem("darkMode", themeToggle.checked);
  location.reload();
});

// Toggle dark mode
themeToggle.addEventListener("change", (e) => {
  document.body.classList.toggle("dark", e.target.checked);
  localStorage.setItem("darkMode", e.target.checked);
});

// Handle incoming WebSocket messages
ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "history") {
    data.messages.forEach((msg) => displayMessage(msg));
  } else if (data.type === "message") {
    displayMessage(data);
  } else if (data.type === "delete") {
    deleteMessageById(data.id);
  } else if (data.type === "clearChat") {
    messagesDiv.innerHTML = ""; // Clear chat for all clients
  } else if (data.type === "updatePfp") {
    updateProfilePicture(data.username, data.pfp);
  }
});

// Update profile picture when received from server
function updateProfilePicture(username, newPfp) {
  document.querySelectorAll(`.message-container[data-username="${username}"] .avatar`).forEach((avatar) => {
    avatar.src = newPfp || "default-pfp.jpg";
  });
}

// Send message when button is clicked or enter key is pressed
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Clear chat functionality
clearChatButton.addEventListener("click", clearChat);

function clearChat() {
  if (confirm("Are you sure you want to clear the entire chat for everyone?")) {
    ws.send(JSON.stringify({ type: "clearChat" }));
    messagesDiv.innerHTML = "";
  }
}

function sendMessage() {
  const text = messageInput.value.trim();
  const mediaFile = mediaInput.files[0];

  if (!text && !mediaFile) {
    alert("You can't send an empty message!");
    return;
  }

  if (mediaFile) {
    const reader = new FileReader();
    reader.onload = () => {
      sendToServer(text || "", reader.result, mediaFile.type);
    };
    reader.readAsDataURL(mediaFile);
  } else {
    sendToServer(text || "", null, null);
  }

  messageInput.value = "";
  mediaInput.value = "";
}

function sendToServer(text, media, mediaType) {
  const messageData = {
    sender: username,
    text,
    media,
    mediaType,
    pfp: profilePic,
    id: Date.now(),
  };

  ws.send(JSON.stringify(messageData));
  displayMessage(messageData);
}

function displayMessage(data) {
  if (!data.text && !data.media) return;

  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message-container");
  messageContainer.setAttribute("data-id", data.id);
  messageContainer.setAttribute("data-username", data.sender);

  const avatarElement = document.createElement("img");
  avatarElement.src = data.pfp || "default-pfp.jpg";
  avatarElement.classList.add("avatar");

  const nameElement = document.createElement("span");
  nameElement.textContent = `${data.sender}: `;
  nameElement.style.fontWeight = "bold";
  nameElement.style.marginRight = "5px";

  const messageElement = document.createElement("div");
  messageElement.classList.add("message-bubble");
  messageElement.textContent = data.text;

  messageContainer.appendChild(avatarElement);
  messageContainer.appendChild(nameElement);
  messageContainer.appendChild(messageElement);

  if (data.media) {
    let mediaElement;
    if (data.mediaType.startsWith("image/")) {
      mediaElement = document.createElement("img");
    } else if (data.mediaType.startsWith("video/")) {
      mediaElement = document.createElement("video");
      mediaElement.controls = true;
    } else {
      mediaElement = document.createElement("a");
      mediaElement.href = data.media;
      mediaElement.textContent = "Download File";
      mediaElement.target = "_blank";
    }

    mediaElement.src = data.media;
    mediaElement.classList.add("media");
    messageContainer.appendChild(mediaElement);
  }

  messagesDiv.appendChild(messageContainer);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Delete message by ID
function deleteMessageById(messageId) {
  const messageToDelete = document.querySelector(`[data-id="${messageId}"]`);
  if (messageToDelete) {
    messageToDelete.remove();
    ws.send(JSON.stringify({ type: "delete", id: messageId }));
  }
}

// Fetch older messages when scrolling up
messagesDiv.addEventListener("scroll", () => {
  if (messagesDiv.scrollTop === 0) {
    ws.send(JSON.stringify({ type: "getHistory" }));
  }
});
