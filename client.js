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
    messageInput.value = '';
  }
}

// Display messages on the screen
function displayMessage(message) {
  if (!message || !message.sender) return;

  // Prevent duplicate messages
  if (document.querySelector(`[data-message-id="${message.id}"]`)) return;

  const messageContainer = document.createElement('div');
  messageContainer.classList.add('message-container');
  messageContainer.setAttribute('data-message-id', message.id); // Unique ID for refresh tracking

  const senderElement = document.createElement('span');
  senderElement.textContent = `${message.sender}: `;
  senderElement.classList.add('sender-name');

  const messageElement = document.createElement('span');
  messageElement.textContent = message.text;
  messageElement.classList.add('message-bubble');

  messageContainer.appendChild(senderElement);
  messageContainer.appendChild(messageElement);
  messagesDiv.appendChild(messageContainer);

  // Scroll to the latest message
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // If this is a normal client message and the bot is active, repeat it after 3 seconds
  if (isBot && message.sender !== "ServerBot") {
    setTimeout(() => {
      const botMessage = { sender: "ServerBot", text: `Echo: ${message.text}` };
      ws.send(JSON.stringify(botMessage));
    }, 3000);
  }
}

// Function to fetch and refresh messages every 100ms
function refreshMessages() {
  ws.send(JSON.stringify({ type: 'fetch-messages' })); // Request latest messages from server
}

// Handle incoming WebSocket messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'history') {
    messagesDiv.innerHTML = ''; // Clear before appending to prevent duplication
    data.messages.forEach(displayMessage);
  } else if (data.type === 'new-message') {
    displayMessage(data.message);
  }
};

// Auto-refresh messages every 100ms
setInterval(refreshMessages, 100);

// Event listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});
