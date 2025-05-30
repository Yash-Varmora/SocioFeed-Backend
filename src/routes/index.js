import { Router } from 'express';
import authRoute from './auth.route.js';
import profileRoute from './profile.route.js';

const route = Router();

route.use('/auth', authRoute);
route.use('/profile', profileRoute);

export default route;
