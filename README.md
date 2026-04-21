# REAL-TIME-COLLABORATION-TOOL

*COMPANY* : CODTECH IT SOLUTIONS

*NAME* : RONY GHOSH

*INTERN ID* : CTIS5139

*DOMAIN* : SOFTWARE DEVELOPMENT

*DURATION* : 12 WEEKS

*MENTOR* : NEELA SANTOSH

## Collab — Real-time Collaborative Editor

A fully functional collaborative code and notes editor with multi-user support,
live cursor tracking, team chat, and WebSocket-powered real-time sync.

---

## Files

| File | Purpose |
|------|---------|
| `collab.html` | The entire frontend — open directly in a browser |
| `server.js`   | Node.js WebSocket server for cross-device collaboration |
| `package.json` | Node.js dependencies |

---

## Option 1 — Same-browser tabs (no server needed)

1. Open `collab.html` in your browser
2. Open it again in a second tab
3. Join with different names — edits sync instantly between tabs

Uses the browser's built-in **BroadcastChannel API** (no install required).

---

## Option 2 — Cross-device (WebSocket server)

### Step 1 — Install dependencies

```bash
npm install
```

### Step 2 — Start the server

```bash
node server.js
```

You'll see:
```
Collab WebSocket Server running
Local:  http://localhost:3001
WS:     ws://localhost:3001
```

### Step 3 — Update collab.html

Open `collab.html` and find this line near the top of the `<script>`:

```js
const WS_URL = null;
```

Change it to:

```js
const WS_URL = 'ws://localhost:3001';
```

### Step 4 — Open in multiple browsers / devices

- Open `http://localhost:3001` in multiple browser windows, tabs, or devices on the same network
- Each person joins with a name and color
- All edits, cursors, and chat messages sync in real-time

---

## Features

- **Real-time sync** — edits propagate to all connected users instantly
- **Code mode** — editor with line numbers, tab support, language selector, code snippets
- **Notes mode** — Markdown-style editor with formatting toolbar
- **Live cursors** — see where each collaborator is editing
- **Team chat** — sidebar chat with typing indicators
- **Multi-room** — add `?room=roomname` to the URL to create separate rooms
- **Auto-reconnect** — WebSocket client reconnects automatically on disconnect
- **Heartbeat** — server detects and cleans up dead connections

---

## Multi-room usage

When using the WebSocket server, rooms are automatic:

```
http://localhost:3001?room=project-alpha
http://localhost:3001?room=project-beta
```

Each room has its own independent session.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3001`  | Server port |

```bash
PORT=8080 node server.js
```
