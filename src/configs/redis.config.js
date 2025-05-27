import { createClient } from 'redis';
import config from '../constants/config.js';

export const redisClient = createClient({
  url: config.REDIS_URL,
});

redisClient.on('error', err => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Connected to Redis Cloud'));

export const connectRedis = async () => {
  await redisClient.connect();
};
