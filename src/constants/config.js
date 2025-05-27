import rateLimit from 'express-rate-limit';

const config = {
  PORT: process.env.PORT,
  RATE_LIMIT_TIME: process.env.RATE_LIMIT_TIME,
  RATE_LIMIT_REQUEST: process.env.RATE_LIMIT_REQUEST,
  FRONTEND_URL: process.env.FRONTEND_URL,
};

export const corsOptions = {
  origin: config.FRONTEND_URL,
  credentials: true,
};

export const limiter = rateLimit({
  windowMs: 60 * 1000 * config.RATE_LIMIT_TIME,
  max: config.RATE_LIMIT_REQUEST,
});

export default config;
