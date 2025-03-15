const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const SECRET_KEY = 'your-secret-key'; // JWT secret key
const users = []; // In-memory user store (for demo purposes)

// Authorized users who can add channels, storing usernames and passcodes
const authorizedUsers = [
  { username: 'admin', passcode: 'adminPasscode' }, // example: username and passcode for authorization
  { username: 'mod', passcode: 'modPasscode' },     // example: username and passcode for authorization
];

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple message store (in-memory or could be replaced with a database)
let messageHistory = {}; // This will hold messages by channels

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Signup Route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  if (users.find(user => user.username === username)) {
    return res.status(400).json({ message: 'Username already taken' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, password: hashedPassword };
  users.push(newUser);

  res.status(200).json({ message: 'User registered successfully' });
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(user => user.username === username);

  if (!user) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
  res.status(200).json({ message: 'Login successful', token });
});

// WebSocket authentication middleware
function authenticateJWT(ws, req, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
    ws.close();
    return;
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid or expired token' }));
      ws.close();
      return;
    }

    ws.user = user;
    next();
  });
}

// When a client connects
wss.on('connection', (ws, req) => {
  authenticateJWT(ws, req, () => {
    console.log('Client connected:', ws.user.username);

    // Send message history for all channels to the newly connected client
    sendAllChannelsHistory(ws);

    // When a client sends a message
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);

        // Handle new messages
        if (data.text && data.channel) {
          const newMessage = {
            id: Date.now().toString(),
            text: data.text,
            sender: ws.user.username,
            timestamp: Date.now(),
            channel: data.channel,
          };

          // Store the new message in the history for the respective channel
          if (!messageHistory[data.channel]) {
            messageHistory[data.channel] = [];
          }
          messageHistory[data.channel].push(newMessage);

          // Save the messages to a file for persistence
          saveMessagesToFile();

          // Broadcast the message to all clients in the same channel
          broadcast({ type: 'new-message', message: newMessage, channel: data.channel });
        }

        // Handle creating a new channel (requires passcode)
        if (data.action === 'create-channel' && data.channel && data.passcode) {
          const authorizedUser = authorizedUsers.find(user => user.username === ws.user.username);
          
          if (authorizedUser && authorizedUser.passcode === data.passcode) {
            // If the user is authorized and the passcode is correct, create the channel
            if (!messageHistory[data.channel]) {
              messageHistory[data.channel] = [];
              saveMessagesToFile();  // Save the new channel to the file
              ws.send(JSON.stringify({ type: 'success', message: `Channel "${data.channel}" created successfully.` }));
              // Optionally broadcast the new channel creation to all users
              broadcast({ type: 'channel-created', channel: data.channel });
            } else {
              ws.send(JSON.stringify({ type: 'error', message: `Channel "${data.channel}" already exists.` }));
            }
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Incorrect passcode or unauthorized user.' }));
          }
        }

      } catch (error) {
        console.error("Invalid message received:", error);
      }
    });

    // When the client disconnects
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
});

// Broadcast data to all clients in the same channel
function broadcast(data) {
  const jsonData = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.user) {
      if (client.user.username !== data.message?.sender) {  // Don't broadcast to the sender
        client.send(jsonData);
      }
    }
  });
}

// Function to send message history to a client for all channels
function sendAllChannelsHistory(ws) {
  Object.keys(messageHistory).forEach(channel => {
    const messages = messageHistory[channel];
    ws.send(JSON.stringify({ type: 'history', channel, messages }));
  });
}

// Function to save message history to a file (for persistence)
function saveMessagesToFile() {
  fs.writeFileSync('messages.json', JSON.stringify(messageHistory, null, 2));
}

// Load messages from file on server startup (optional)
function loadMessagesFromFile() {
  if (fs.existsSync('messages.json')) {
    const data = fs.readFileSync('messages.json');
    messageHistory = JSON.parse(data);
  }
}

// Load existing messages when the server starts
loadMessagesFromFile();

// Start the server
server.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
