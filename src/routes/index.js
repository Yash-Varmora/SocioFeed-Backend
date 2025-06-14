import { Router } from 'express';
import authRoute from './auth.route.js';
import profileRoute from './profile.route.js';
import userRoute from './user.route.js';
import followRoute from './follow.route.js';
import postRoute from './post.route.js';
import notificationRoute from './notification.route.js';
import hashtagRoute from './hashtag.route.js';
import commentRoute from './comment.route.js';
import messageRoute from './message.route.js';
import chatRoute from './chat.route.js';

const route = Router();

route.use('/auth', authRoute);
route.use('/profile', profileRoute);
route.use('/users', userRoute);
route.use('/follows', followRoute);
route.use('/posts', postRoute);
route.use('/notifications', notificationRoute);
route.use('/hashtags', hashtagRoute);
route.use('/comments', commentRoute);
route.use('/messages', messageRoute);
route.use('/chats', chatRoute);

export default route;
