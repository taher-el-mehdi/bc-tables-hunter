import { createServer } from './server.js';
import { env } from './config/env.js';
import { connectDB } from './models/db.js';

const { app, httpServer } = createServer();

connectDB()
  .then((enabled) => {
    if (enabled) console.log('MongoDB connected. Persistence enabled.');
    else console.log('Persistence disabled. Running in-memory only.');
  })
  .catch((err) => console.error('MongoDB connection failed:', err?.message || err));

async function startWithFallback(host: string, initialPort: number) {
  const candidates = [initialPort, 3001, 8081, 4000, 5001];
  for (const port of candidates) {
    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (err: any) => {
          httpServer.off('error', onError);
          reject(err);
        };
        httpServer.once('error', onError);
        httpServer.listen(port, host, () => {
          httpServer.off('error', onError);
          resolve();
        });
      });
      console.log(`BC Tables Hunter backend listening on http://${host}:${port}`);
      return port;
    } catch (err: any) {
      const code = err?.code;
      if (code !== 'EACCES' && code !== 'EADDRINUSE') {
        console.error('Server start failed:', err?.message || err);
        break;
      }
      console.warn(`Port ${port} unavailable (${code}). Trying next...`);
    }
  }
  throw new Error('No available port to start the server.');
}

startWithFallback(env.HOST, env.PORT).catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
