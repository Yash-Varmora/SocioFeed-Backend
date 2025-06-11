import { Router } from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import { getMessages } from '../controllers/message.controller.js';

const route = Router();

route.get('/:chatId', verifyToken, getMessages);

export default route;
