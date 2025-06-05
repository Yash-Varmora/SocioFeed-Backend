import { Router } from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import { suggestHashtags } from '../controllers/hashtag.controller.js';

const route = Router();

route.get('/suggest', verifyToken, suggestHashtags);

export default route;
