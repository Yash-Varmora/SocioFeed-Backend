import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
  setAuthCookies,
  clearAuthCookies,
  removeRefreshToken,
} from '../services/token.service.js';
import prisma from '../configs/prisma.config.js';
import { CustomError } from '../helpers/response.js';

let isRefreshing = false;
let pendingRequests = [];

const resolvePendingRequests = () => {
  pendingRequests.forEach(callback => callback());
  pendingRequests = [];
};

const verifyToken = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    clearAuthCookies(res);
    if (accessToken) {
      await removeRefreshToken(refreshToken);
    }
    return next(new CustomError(401, 'Something want wrong, please login again'));
  }
  if (!accessToken) {
    return handleRefresh(req, res, next);
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    req.user = payload;
    return next();
  } catch (error) {
    console.log('Token verification error:', error.message);
    if (error.message === 'jwt expired') {
      return handleRefresh(req, res, next);
    }
    clearAuthCookies(res);
    return next(new CustomError(401, 'Invalid token'));
  }
};

const handleRefresh = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    clearAuthCookies(res);
    return next(new CustomError(401, 'Invalid token'));
  }

  if (isRefreshing) {
    return new Promise(resolve => {
      pendingRequests.push(() => {
        verifyToken(req, res, next);
        resolve();
      });
    });
  }

  isRefreshing = true;

  try {
    const payload = await verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      await removeRefreshToken(refreshToken);
      await clearAuthCookies(res);
      return next(new CustomError(400, 'User not found'));
    }

    const newAccessToken = generateAccessToken(user);
    setAuthCookies(res, newAccessToken, refreshToken);

    req.user = payload;
    isRefreshing = false;
    resolvePendingRequests();
    return next();
  } catch (error) {
    isRefreshing = false;
    await removeRefreshToken(refreshToken);
    clearAuthCookies(res);
    resolvePendingRequests();
    console.log('Error refreshing token:', error.message);
    return next(new CustomError(401, 'Invalid token'));
  }
};

export default verifyToken;
