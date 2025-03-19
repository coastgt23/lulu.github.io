const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

const MESSAGE_FILE = path.join(__dirname, 'messages.json');

// Load messages from file
let messageHistory = [];
if (fs.existsSync(MESSAGE_FILE)) {
  try {
    messageHistory = JSON.parse(fs.readFileSync(MESSAGE_FILE, 'utf-8'));
  } catch (error) {
    console.error("Error loading messages:", error);
    messageHistory = [];
  }
}

// Save messages to file
function saveMessages() {
  fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messageHistory, null, 2));
}

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send chat history to the newly connected client
  ws.send(JSON.stringify({ type: 'history', messages: messageHistory }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const newMessage = { sender: data.sender, text: data.text, media: data.media || null };

      // Save message
      messageHistory.push(newMessage);
      saveMessages();

      // Broadcast message to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'message', sender: data.sender, text: data.text, media: data.media || null }));
        }
      });
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
