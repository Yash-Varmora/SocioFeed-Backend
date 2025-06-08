import { Router } from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import {
  createComment,
  deleteComment,
  editComment,
  getComments,
  likeComment,
  unlikeComment,
} from '../controllers/comment.controller.js';

const route = Router();

route.post('/', verifyToken, createComment);
route.patch('/:id', verifyToken, editComment);
route.delete('/:id', verifyToken, deleteComment);
route.get('/:postId', verifyToken, getComments);
route.post('/:id/like', verifyToken, likeComment);
route.delete('/:id/like', verifyToken, unlikeComment);

export default route;
