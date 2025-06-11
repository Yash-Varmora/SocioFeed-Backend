import jwt from 'jsonwebtoken';
import config from '../constants/config.js';
import prisma from '../configs/prisma.config.js';
import { CustomError } from '../helpers/response.js';

function generateAccessToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, config.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m',
  });
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, config.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
}

const storeRefreshToken = async (userId, token) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.token.create({
    data: { userId, token, expiresAt },
  });
};

const removeRefreshToken = async refreshToken => {
  try {
    const token = await prisma.token.findFirst({
      where: { token: refreshToken },
      select: { id: true },
    });
    if (token) {
      await prisma.token.delete({ where: { id: token.id } });
    }
  } catch (error) {
    console.log('Error removing refresh token:', error.message);
    throw new CustomError(400, error.message);
  }
};

const verifyRefreshToken = async token => {
  try {
    const payload = jwt.verify(token, config.REFRESH_TOKEN_SECRET);
    const storedToken = await prisma.token.findFirst({
      where: { token, userId: payload.id, expiresAt: { gt: new Date() } },
    });
    if (!storedToken) throw new CustomError(400, 'Invalid refresh token');
    return payload;
  } catch (error) {
    console.log('verifyRefreshToken error', error.message);
    throw new CustomError(400, error.message);
  }
};

const verifyAccessToken = async token => {
  try {
    const payload = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
    return payload;
  } catch (error) {
    console.log('verifyAccessToken error', error.message);
    throw new CustomError(400, error.message);
  }
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie('isLoggedIn', 'true', {
    httpOnly: false,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = res => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('isLoggedIn');
};

export {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  removeRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
  setAuthCookies,
  clearAuthCookies,
};
