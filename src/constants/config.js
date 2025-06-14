import rateLimit from 'express-rate-limit';

const config = {
  PORT: process.env.PORT,
  RATE_LIMIT_TIME: process.env.RATE_LIMIT_TIME,
  RATE_LIMIT_REQUEST: process.env.RATE_LIMIT_REQUEST,
  FRONTEND_URL: process.env.FRONTEND_URL,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
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
