import { Router } from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js';
import {
  createPost,
  deletePost,
  getFeed,
  getPost,
  getPostLikes,
  getSavedPosts,
  likePost,
  savePost,
  unlikePost,
  unsavePost,
  updatePost,
} from '../controllers/post.controller.js';

const route = Router();

route.post('/', verifyToken, upload.array('media', 4), createPost);
route.get('/feed', verifyToken, getFeed);
route.get('/saved', verifyToken, getSavedPosts);
route.get('/:id', verifyToken, getPost);
route.put('/:id', verifyToken, updatePost);
route.delete('/:id', verifyToken, deletePost);
route.post('/:id/like', verifyToken, likePost);
route.delete('/:id/like', verifyToken, unlikePost);
route.post('/:id/save', verifyToken, savePost);
route.delete('/:id/save', verifyToken, unsavePost);
route.get('/:id/likes', verifyToken, getPostLikes);

export default route;
