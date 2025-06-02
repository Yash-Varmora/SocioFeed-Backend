import { Router } from 'express';
import { getMutualFriends, searchUsers } from '../controllers/user.controller.js';
import verifyToken from '../middleware/authMiddleware.js';

const route = Router();

route.post('/search', searchUsers);
route.get('/:username/mutual-friends', verifyToken, getMutualFriends);

export default route;
