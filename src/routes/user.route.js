import { Router } from 'express';
import {
  getFollowers,
  getFollowing,
  getMutualFriends,
  searchUsers,
} from '../controllers/user.controller.js';
import verifyToken from '../middleware/authMiddleware.js';

const route = Router();

route.post('/search', searchUsers);
route.get('/:username/followers', verifyToken, getFollowers);
route.get('/:username/following', verifyToken, getFollowing);
route.get('/:username/mutual-friends', verifyToken, getMutualFriends);

export default route;
