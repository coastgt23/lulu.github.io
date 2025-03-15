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

const reactionMenu = document.getElementById('reactionMenu');
let currentMessageElement = null; // Store the current message being reacted to

// Show the reaction menu when right-clicking on a message
messagesDiv.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Prevent the default context menu
    if (event.target.closest('.message')) {
        currentMessageElement = event.target.closest('.message');
        const messageId = currentMessageElement.dataset.messageId; // Get the message ID
        // Position the reaction menu near the mouse cursor
        reactionMenu.style.display = 'block';
        reactionMenu.style.left = `${event.pageX}px`;
        reactionMenu.style.top = `${event.pageY}px`;

        // Add a custom data attribute to identify the message
        reactionMenu.dataset.messageId = messageId;
    }
});

// Hide the reaction menu if the user clicks elsewhere
document.addEventListener('click', (event) => {
    if (!reactionMenu.contains(event.target)) {
        reactionMenu.style.display = 'none';
    }
});

// Handle reaction selection
const reactionButtons = document.querySelectorAll('.reaction-btn');
reactionButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const reaction = event.target.dataset.reaction;
        const messageId = reactionMenu.dataset.messageId; // Get the message ID from the menu

        // Send the reaction to the server
        ws.send(JSON.stringify({
            type: 'reaction',
            messageId: messageId,
            reaction: reaction,
            sender: username
        }));

        // Hide the reaction menu
        reactionMenu.style.display = 'none';
    });
});

// Function to display reactions on a message
function displayReaction(messageId, reaction, sender) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        const reactionsContainer = messageElement.querySelector('.reactions-container') || document.createElement('div');
        reactionsContainer.classList.add('reactions-container');
        messageElement.appendChild(reactionsContainer);

        const reactionElement = document.createElement('span');
        reactionElement.classList.add('reaction');
        reactionElement.textContent = `${sender}: ${reaction}`;
        reactionsContainer.appendChild(reactionElement);
    }
}

// Server-side part: Handle incoming reactions and broadcast them
ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'reaction') {
        // Display the reaction on the UI
        displayReaction(data.messageId, data.reaction, data.sender);
    }
});

function displayMessage(message, sender, profilePicUrl, messageId) {
  if (!message || !sender) return;

  // Convert Markdown to HTML and sanitize it
  const parsedMessage = marked(message);
  const sanitizedMessage = DOMPurify.sanitize(parsedMessage);

  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.setAttribute('data-message-id', messageId);

  // Create the profile picture element with an event listener
  const profilePic = document.createElement('img');
  profilePic.src = profilePicUrl;
  profilePic.alt = `${sender}'s profile picture`;
  profilePic.classList.add('profile-pic');
  profilePic.addEventListener('click', () => openProfilePicModal(profilePicUrl, sender)); // Open modal on click

  messageElement.innerHTML = `
      <strong>${sender}</strong>: ${sanitizedMessage}
      <div class="reactions-container"></div>
  `;
  
  messageElement.insertBefore(profilePic, messageElement.firstChild); // Insert profile picture at the beginning of the message
  
  // Append the message to the messages container
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function openProfilePicModal(profilePicUrl, sender) {
  const modal = document.getElementById('profilePicModal');
  const modalImg = document.getElementById('modalProfilePic');
  const modalCaption = document.getElementById('modalCaption');
  
  // Set the modal content
  modalImg.src = profilePicUrl;
  modalCaption.innerHTML = `${sender}'s Profile Picture`; // Optional caption

  // Display the modal
  modal.style.display = "block";
}

// Close the modal when the close button is clicked
const closeModal = document.getElementById('closeModal');
closeModal.addEventListener('click', () => {
  const modal = document.getElementById('profilePicModal');
  modal.style.display = "none";
});

// Close the modal if the user clicks outside of the image
window.addEventListener('click', (event) => {
  const modal = document.getElementById('profilePicModal');
  if (event.target === modal) {
      modal.style.display = "none";
  }
});
