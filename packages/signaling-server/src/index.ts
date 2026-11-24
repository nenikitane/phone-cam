import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const HOST = process.env.HOST || '0.0.0.0';

interface Client {
  id: string;
  ws: WebSocket;
  role: 'camera' | 'viewer';
  roomId: string;
}

const rooms = new Map<string, { camera?: Client; viewers: Set<Client> }>();

const server = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      rooms: rooms.size,
      timestamp: Date.now() 
    }));
    return;
  }
  
  // Room stats endpoint
  if (req.url?.startsWith('/rooms') && req.method === 'GET') {
    const stats = Array.from(rooms.entries()).map(([id, room]) => ({
      id,
      hasCamera: !!room.camera,
      viewerCount: room.viewers.size,
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ rooms: stats }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

function broadcastToRoom(roomId: string, message: object, exclude?: Client) {
  const room = rooms.get(roomId);
  if (!room) return;

  const data = JSON.stringify(message);
  if (room.camera && room.camera !== exclude && room.camera.ws.readyState === WebSocket.OPEN) {
    room.camera.ws.send(data);
  }
  room.viewers.forEach(viewer => {
    if (viewer !== exclude && viewer.ws.readyState === WebSocket.OPEN) {
      viewer.ws.send(data);
    }
  });
}

function handleMessage(client: Client, message: any) {
  const room = rooms.get(client.roomId);
  if (!room) return;

  switch (message.type) {
    case 'offer':
      // Camera sends offer to all viewers
      if (client.role === 'camera') {
        room.viewers.forEach(viewer => {
          if (viewer.ws.readyState === WebSocket.OPEN) {
            viewer.ws.send(JSON.stringify({ type: 'offer', sdp: message.sdp, from: client.id }));
          }
        });
      }
      break;

    case 'answer':
      // Viewer sends answer back to camera
      if (client.role === 'viewer' && room.camera) {
        room.camera.ws.send(JSON.stringify({ type: 'answer', sdp: message.sdp, from: client.id }));
      }
      break;

    case 'ice-candidate':
      // Relay ICE candidates
      if (client.role === 'camera') {
        room.viewers.forEach(viewer => {
          if (viewer.ws.readyState === WebSocket.OPEN) {
            viewer.ws.send(JSON.stringify({ type: 'ice-candidate', candidate: message.candidate, from: client.id }));
          }
        });
      } else if (client.role === 'viewer' && room.camera) {
        room.camera.ws.send(JSON.stringify({ type: 'ice-candidate', candidate: message.candidate, from: client.id }));
      }
      break;

    case 'get-viewers':
      // Camera requests viewer list
      if (client.role === 'camera') {
        const viewers = Array.from(room.viewers).map(v => ({ id: v.id }));
        client.ws.send(JSON.stringify({ type: 'viewers-list', viewers }));
      }
      break;
  }
}

function handleClose(client: Client) {
  const room = rooms.get(client.roomId);
  if (!room) return;

  if (client.role === 'camera') {
    room.camera = undefined;
    // Notify viewers that camera disconnected
    room.viewers.forEach(viewer => {
      if (viewer.ws.readyState === WebSocket.OPEN) {
        viewer.ws.send(JSON.stringify({ type: 'camera-disconnected' }));
      }
    });
  } else {
    room.viewers.delete(client);
    // Notify camera that viewer left
    if (room.camera && room.camera.ws.readyState === WebSocket.OPEN) {
      room.camera.ws.send(JSON.stringify({ type: 'viewer-left', viewerId: client.id }));
    }
  }

  // Clean up empty rooms
  if (!room.camera && room.viewers.size === 0) {
    rooms.delete(client.roomId);
  }
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const roomId = url.searchParams.get('room') || 'default';
  const role = (url.searchParams.get('role') as 'camera' | 'viewer') || 'viewer';
  const clientId = uuidv4();

  const client: Client = { id: clientId, ws, role, roomId };

  let room = rooms.get(roomId);
  if (!room) {
    room = { viewers: new Set() };
    rooms.set(roomId, room);
  }

  if (role === 'camera') {
    if (room.camera) {
      ws.send(JSON.stringify({ type: 'error', message: 'Camera already connected to this room' }));
      ws.close();
      return;
    }
    room.camera = client;
    console.log(`[${roomId}] Camera connected: ${clientId}`);
  } else {
    room.viewers.add(client);
    console.log(`[${roomId}] Viewer connected: ${clientId} (total: ${room.viewers.size})`);
  }

  ws.send(JSON.stringify({ type: 'connected', clientId, roomId, role }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(client, message);
    } catch (e) {
      console.error('Invalid message:', e);
    }
  });

  ws.on('close', () => {
    handleClose(client);
    console.log(`[${roomId}] ${role} disconnected: ${clientId}`);
  });

  ws.on('error', (err) => {
    console.error(`[${roomId}] WebSocket error:`, err);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Signaling server running on ${HOST}:${PORT}`);
  console.log(`WebSocket endpoint: ws://${HOST}:${PORT}/?room=ROOM_ID&role=camera|viewer`);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  wss.close(() => server.close(() => process.exit(0)));
});