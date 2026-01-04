import { createServer } from './server';
import { env } from './config/env';
import { connectDB } from './models/db';

const { app, httpServer } = createServer();

connectDB()
  .then((enabled) => {
    if (enabled) console.log('MongoDB connected. Persistence enabled.');
    else console.log('Persistence disabled. Running in-memory only.');
  })
  .catch((err) => console.error('MongoDB connection failed:', err?.message || err));

httpServer.listen(env.PORT, env.HOST, () => {
  console.log(`BC Tables Hunter backend listening on http://${env.HOST}:${env.PORT}`);
});
