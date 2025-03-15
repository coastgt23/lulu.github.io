const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

// In-memory user store (replace with a database in a real app)
const users = {};

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'signup') {
      handleSignup(ws, data.username, data.password);
    } else if (data.type === 'login') {
      handleLogin(ws, data.username, data.password);
    }
  });
});

// Handle User Sign-Up
function handleSignup(ws, username, password) {
  if (users[username]) {
    // User already exists
    ws.send(JSON.stringify({ type: 'auth-error', message: 'Username already taken.' }));
  } else {
    // Create new user
    users[username] = { password };
    ws.send(JSON.stringify({ type: 'signup-success' }));
  }
}

// Handle User Login
function handleLogin(ws, username, password) {
  if (users[username] && users[username].password === password) {
    // Successful login
    ws.send(JSON.stringify({ type: 'login-success' }));
  } else {
    // Invalid login credentials
    ws.send(JSON.stringify({ type: 'auth-error', message: 'Invalid username or password.' }));
  }
}

console.log('Server running on ws://localhost:3000');
