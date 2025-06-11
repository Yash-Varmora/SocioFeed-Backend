import http from 'http';
import app from './src/app.js';
import config from './src/constants/config.js';
import { connectDB } from './src/configs/prisma.config.js';
import initializeSocket from './src/helpers/initializeSocket.js';

const port = config.PORT || 5000;

const startServer = async () => {
  try {

    await connectDB()
    const server = http.createServer(app);
    initializeSocket(server)
    server.listen(port, () => {
      console.log(`Listening from port: ${port}`);
    });
  } catch (error) {
    console.error('Server Failed to Start!', error);
    process.exit(1)
  }
}

startServer()
