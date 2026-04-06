import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { WebSocketServer } from 'ws';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documentRoutes.js';
import { setupWSConnection } from './utils/yjs.js';

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

const wss = new WebSocketServer({ noServer: true });

console.log(wss);

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url!, `http://${request.headers.host}`);
  const isCollabRoute = pathname.startsWith('/collab-room-');

  if (isCollabRoute) {
    console.log(`📡 Upgrading connection for: ${pathname}`);

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    console.warn(`Rejected websocket upgrade for unsupported path: ${pathname}`);
    socket.destroy();
  }
});

wss.on('connection', (conn, req) => {
  console.log('✨ Yjs Connection fully established and stable!', req.url);
  setupWSConnection(conn, req);
  
  // Keep-alive: Send a ping every 30 seconds to prevent timeout
  const timer = setInterval(() => {
    if (conn.readyState === conn.OPEN) {
      conn.ping();
    } else {
      clearInterval(timer);
    }
  }, 30000);

  conn.on('close', () => {
    clearInterval(timer);
  });
});