import http from 'http';
import app from './src/app.js';
import config from './src/constants/config.js';

const port = config.PORT || 5000;
(async () => {
  try {
    const server = http.createServer(app);

    server.listen(port, () => {
      console.warn(`Listening from port: ${port}`);
    });
  } catch (error) {
    console.error('Server Failed to Start!', error);
  }
})();
