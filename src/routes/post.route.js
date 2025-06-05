import { Router } from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js';
import {
  createPost,
  deletePost,
  getFeed,
  getPost,
  updatePost,
} from '../controllers/post.controller.js';

const route = Router();

route.post('/', verifyToken, upload.array('media', 4), createPost);
route.get('/feed', verifyToken, getFeed);
route.get('/:id', verifyToken, getPost);
route.put('/:id', verifyToken, updatePost);
route.delete('/:id', verifyToken, deletePost);

export default route;
