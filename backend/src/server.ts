import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import roomsRouter from './routes/rooms.routes.js';
import { registerSocketHandlers } from './sockets/events.js';
import { adminRouter } from './routes/admin.routes.js';

export function createServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(rateLimiter);

  app.use('/rooms', roomsRouter(io));

  
  // Admin endpoints (Basic Auth protected)
  app.use('/admin', adminRouter());
  app.use(errorHandler);

  registerSocketHandlers(io);
  return { app, httpServer, io };
}
