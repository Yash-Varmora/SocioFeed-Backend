import { Router } from 'express';
import authRoute from './auth.route.js';
import profileRoute from './profile.route.js';
import userRoute from './user.route.js';

const route = Router();

route.use('/auth', authRoute);
route.use('/profile', profileRoute);
route.use('/users', userRoute);

export default route;
