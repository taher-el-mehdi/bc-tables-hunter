import { Router } from 'express';
import type { Server } from 'socket.io';
import { validate, createRoomSchema, joinRoomSchema, startRoomSchema } from '../middleware/validation';
import { RoomsController } from '../controllers/rooms.controller';

export default function roomsRouter(io: Server) {
  const router = Router();
  const controller = RoomsController(io);

  router.post('/', validate(createRoomSchema), controller.createRoom);
  router.post('/:code/join', validate(joinRoomSchema), controller.joinRoom);
  router.post('/:code/start', validate(startRoomSchema), controller.startRoom);
  router.get('/:code/state', controller.getRoomState);

  return router;
}
