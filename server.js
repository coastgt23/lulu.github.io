const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-admin-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const messagesCollection = db.collection('messages');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

let messageHistory = [];
let connectedUsers = new Map();

// Load messages from Firestore
async function loadMessages() {
  const snapshot = await messagesCollection.orderBy('timestamp').get();
  messageHistory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

loadMessages();

wss.on('connection', async (ws) => {
  console.log('Client connected');

  let userId = `User-${Math.floor(Math.random() * 1000)}`;
  connectedUsers.set(ws, userId);

  ws.send(JSON.stringify({ type: 'history', messages: messageHistory }));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle name change
      if (data.type === 'change-name') {
        connectedUsers.set(ws, data.name);
        return;
      }

      // Handle message sending
      if (data.text) {
        const newMessage = {
          text: data.text,
          sender: data.sender,
          timestamp: Date.now(),
          profilePicUrl: data.profilePicUrl,
          reactions: []
        };
        
        const newMessageRef = await messagesCollection.add(newMessage);
        const newMessageObj = { id: newMessageRef.id, ...newMessage };
        messageHistory.push(newMessageObj);

        // Broadcast the new message
        broadcast({ type: 'new-message', messages: messageHistory });
      }

      // Handle reactions
      if (data.type === 'reaction') {
        const messageId = data.messageId;
        const reaction = data.reaction;

        // Find the message in the history and add the reaction
        const messageToUpdate = messageHistory.find(msg => msg.id === messageId);
        if (messageToUpdate) {
          if (!messageToUpdate.reactions) {
            messageToUpdate.reactions = [];
          }
          messageToUpdate.reactions.push(reaction);

          // Broadcast the updated message with reactions
          broadcast({ type: 'reaction', messageId, reaction, user: data.user });
        }
      }
    } catch (error) {
      console.error("Invalid message received:", error);
    }
  });

  ws.on('close', () => {
    console.log(`${userId} disconnected`);
    connectedUsers.delete(ws);
  });

  // Function to broadcast data to all clients
  function broadcast(data) {
    const jsonData = JSON.stringify(data);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(jsonData);
      }
    });
  }
});

server.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});

// Example WebSocket server handler for reactions
ws.on('message', (message) => {
  const data = JSON.parse(message);

  if (data.type === 'reaction') {
      // Broadcast the reaction to all clients
      broadcast({ type: 'reaction', messageId: data.messageId, reaction: data.reaction, sender: data.sender });
  }
});

