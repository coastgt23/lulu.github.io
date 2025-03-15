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

