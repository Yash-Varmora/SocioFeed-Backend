import { Router } from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import { createDirectChat, createGroupChat, getChats } from '../controllers/chat.controller.js';

const route = Router();

route.get('/', verifyToken, getChats);
route.post('/direct', verifyToken, createDirectChat);
route.post('/group', verifyToken, createGroupChat);

export default route;
