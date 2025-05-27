import http from 'http';
import app from './src/app.js';
import config from './src/constants/config.js';
import { connectDB } from './src/configs/prisma.config.js';
import { connectRedis } from './src/configs/redis.config.js';

const port = config.PORT || 5000;

const startServer = async () => {
  try {

    await connectDB()
    try {
      await connectRedis();
    } catch (redisErr) {
      console.error('Redis connection failed:', redisErr);
    }
    const server = http.createServer(app);

    server.listen(port, () => {
      console.log(`Listening from port: ${port}`);
    });
  } catch (error) {
    console.error('Server Failed to Start!', error);
    process.exit(1)
  }
}

startServer()
