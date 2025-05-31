import { Router } from 'express';
import { searchUsers } from '../controllers/user.controller.js';

const route = Router();

route.post('/search', searchUsers);

export default route;
