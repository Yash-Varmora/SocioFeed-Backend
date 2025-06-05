import { Router } from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import { getNotifications } from '../controllers/notification.controller.js';

const route = Router();

route.get('/', verifyToken, getNotifications);

export default route;
