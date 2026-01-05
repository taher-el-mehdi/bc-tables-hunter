import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Basic ')) {
      res.status(401).setHeader('WWW-Authenticate', 'Basic realm="Admin"').json({ error: 'Unauthorized' });
      return;
    }
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');
    if (user === env.ADMIN_USER && pass === env.ADMIN_PASS) return next();
    res.status(401).json({ error: 'Unauthorized' });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
