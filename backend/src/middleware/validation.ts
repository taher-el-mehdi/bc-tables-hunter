import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export function validate(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    next();
  };
}

export const createRoomSchema = z.object({
  body: z.object({
    maxPlayers: z.number().int().min(2).max(16).optional(),
  }),
});

export const joinRoomSchema = z.object({
  params: z.object({ code: z.string().min(4) }),
  body: z.object({
    playerName: z.string().min(1).max(32),
    sound: z.object({ music: z.boolean().optional(), sfx: z.boolean().optional() }).optional(),
  }),
});

export const startRoomSchema = z.object({
  params: z.object({ code: z.string().min(4) }),
});
