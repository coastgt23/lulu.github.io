const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });

let messages = []; // Store messages in memory

wss.on('connection', (ws) => {
  console.log('A new client connected');
  
  // Send the previous messages to the new client
  ws.send(JSON.stringify({ type: 'history', messages }));

  // Listen for messages from clients
  ws.on('message', (data) => {
    const message = JSON.parse(data);

    // Save the message
    messages.push(message);

    // Broadcast the message to all connected clients
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'message', text: message.text, sender: message.sender, senderPfp: message.senderPfp }));
      }
    });
  });

  // Handle the client closing the connection
  ws.on('close', () => {
    console.log('A client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:3000');
