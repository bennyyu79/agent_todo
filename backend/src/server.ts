import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { applyTaskRoutes } from './routes/tasks';
import { applyMessageRoutes } from './routes/messages';
import { applyDataRoutes } from './routes/data';
import { setupFileWatcher } from './fileWatcher';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store connected clients
const clients = new Set<WebSocket>();

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);
  console.log('Client connected. Total clients:', clients.size);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast message to all clients
function broadcast(eventType: string, payload: any) {
  const message = JSON.stringify({
    type: eventType,
    payload,
    timestamp: new Date().toISOString()
  });

  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Apply routes
applyTaskRoutes(app, broadcast);
applyMessageRoutes(app, broadcast);
applyDataRoutes(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', clients: clients.size });
});

// Start file watcher to monitor real .claude directory
const fileWatcher = setupFileWatcher(broadcast);

// Load initial data from .claude directory on startup
if (fileWatcher) {
  console.log('File watcher is active - monitoring real .claude directory');
  console.log('Teams, tasks, and messages will be loaded from ~/.claude/');
} else {
  console.log('File watcher is not active - .claude directory not found');
  console.log('Please ensure ~/.claude/teams/ and ~/.claude/tasks/ directories exist');
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready`);
});

export { broadcast };
