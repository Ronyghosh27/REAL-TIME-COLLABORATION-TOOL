/**
 * Collab — WebSocket Server
 * ─────────────────────────
 * Enables real-time collaboration across different devices & networks.
 *
 * SETUP:
 *   npm install ws
 *   node server.js
 *
 * Then set WS_URL = 'ws://localhost:3001' in collab.html
 */

const WebSocket = require('ws');
const http      = require('http');
const fs        = require('fs');
const path      = require('path');

const PORT = process.env.PORT || 3001;

// ── HTTP server (serves collab.html) ──────────────────────────────────
const httpServer = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const filePath = path.join(__dirname, 'collab.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('collab.html not found — place it in the same folder as server.js');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

// ── WebSocket server ───────────────────────────────────────────────────
const wss = new WebSocket.Server({ server: httpServer });

// rooms: Map<roomId, Map<clientId, { ws, user }>>
const rooms = new Map();
const DEFAULT_ROOM = 'main';

function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  return rooms.get(roomId);
}

function broadcast(roomId, message, excludeId = null) {
  const room = getRoom(roomId);
  const data = JSON.stringify(message);
  room.forEach((client, id) => {
    if (id !== excludeId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

function broadcastAll(roomId, message) {
  broadcast(roomId, message, null);
}

wss.on('connection', (ws, req) => {
  // Extract room from query string: ws://host:3001?room=roomId
  const url     = new URL(req.url, `http://${req.headers.host}`);
  const roomId  = url.searchParams.get('room') || DEFAULT_ROOM;
  const clientId = 'c_' + Math.random().toString(36).slice(2, 9);

  const room = getRoom(roomId);
  room.set(clientId, { ws, user: null });

  console.log(`[${new Date().toISOString()}] Client ${clientId} connected to room "${roomId}" (${room.size} total)`);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (e) {
      return;
    }

    // Update stored user info
    if (msg.user) {
      const client = room.get(clientId);
      if (client) client.user = msg.user;
    }

    // Stamp with server clientId so client can filter own echo
    msg.from = msg.from || clientId;

    switch (msg.type) {
      case 'join':
        // Broadcast join to others
        broadcast(roomId, msg, clientId);
        // Send current room state back to new joiner
        const others = [];
        room.forEach((c, id) => {
          if (id !== clientId && c.user) others.push(c.user);
        });
        if (others.length > 0) {
          ws.send(JSON.stringify({ type: 'room_state', users: others }));
        }
        console.log(`  ↳ ${msg.user?.name || 'unknown'} joined room "${roomId}"`);
        break;

      case 'leave':
        broadcast(roomId, msg, clientId);
        room.delete(clientId);
        console.log(`  ↳ ${msg.user?.name || clientId} left room "${roomId}" (${room.size} remaining)`);
        break;

      case 'content':
      case 'cursor':
      case 'chat':
      case 'typing':
      case 'title':
      case 'mode':
      case 'presence':
        // Relay to all other clients in room
        broadcast(roomId, msg, clientId);
        break;

      default:
        console.log(`Unknown message type: ${msg.type}`);
    }
  });

  ws.on('close', () => {
    const client = room.get(clientId);
    if (client?.user) {
      broadcast(roomId, { type: 'leave', from: clientId, user: client.user }, clientId);
      console.log(`[${new Date().toISOString()}] ${client.user.name} disconnected from room "${roomId}"`);
    }
    room.delete(clientId);
    if (room.size === 0) {
      rooms.delete(roomId);
      console.log(`Room "${roomId}" cleaned up (empty)`);
    }
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error for ${clientId}:`, err.message);
  });

  // Ping/pong keepalive
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
});

// Heartbeat — detect dead connections
const heartbeat = setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

// ── Start ──────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log('\n┌─────────────────────────────────────────────┐');
  console.log(`│  Collab WebSocket Server running             │`);
  console.log(`│                                              │`);
  console.log(`│  Local:   http://localhost:${PORT}              │`);
  console.log(`│  WS:      ws://localhost:${PORT}                │`);
  console.log(`│                                              │`);
  console.log(`│  Open collab.html and set:                   │`);
  console.log(`│    WS_URL = 'ws://localhost:${PORT}'            │`);
  console.log(`└─────────────────────────────────────────────┘\n`);
});