import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
  setAuthCookies,
  clearAuthCookies,
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
  if (!accessToken) {
    return handleRefresh(req, res, next);
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    req.user = payload;
    return next();
  } catch (error) {
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
    clearAuthCookies(res);
    resolvePendingRequests();
    console.log('Error refreshing token:', error.message);
    return next(new CustomError(401, 'Invalid token'));
  }
};

export default verifyToken;
