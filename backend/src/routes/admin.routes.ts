import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { RoomModel } from '../models/Room.js';

export function adminRouter() {
  const router = Router();
  router.use(adminAuth);

  router.get('/rooms', async (req, res) => {
    try {
      const rooms = await RoomModel.find().lean();
      res.json(rooms.map(r => ({ code: r.code, status: r.status, playersCount: r.playersCount })));
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  });

  router.get('/rooms/:code', async (req, res) => {
    try {
      const r = await RoomModel.findOne({ code: req.params.code }).lean();
      if (!r) return res.status(404).json({ error: 'Room not found' });
      res.json({ code: r.code, status: r.status, players: r.players });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  });

  router.get('/leaderboard', async (req, res) => {
    try {
      const rooms = await RoomModel.find().lean();
      const allPlayers = rooms.flatMap(r => r.players || []);
      const top = allPlayers.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 20);
      // highest score per room
      const perRoom = rooms.map(r => ({ code: r.code, top: (r.players || []).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0] })).filter(Boolean);
      res.json({ topPlayers: top, perRoom });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  });

  return router;
}
