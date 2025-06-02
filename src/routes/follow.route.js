import { Router } from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import { followUser, unfollowUser } from '../controllers/follow.controller.js';

const route = Router();

route.post('/', verifyToken, followUser);
route.delete('/:followingId', verifyToken, unfollowUser);

export default route;
