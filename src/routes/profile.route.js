import { Router } from 'express';
import {
  getProfile,
  getUserPostsController,
  updateProfileController,
  uploadAvatar,
} from '../controllers/profile.controller.js';
import verifyToken from '../middleware/authMiddleware.js';
import { updateProfileValidation } from '../validators/profileValidators.js';
import validate from '../middleware/validators.js';
import upload from '../middleware/multer.js';

const route = Router();

route.get('/:username', verifyToken, getProfile);
route.get('/:username/posts', verifyToken, getUserPostsController);
route.put('/me', verifyToken, updateProfileValidation, validate, updateProfileController);
route.post('/me/avatar', verifyToken, upload.single('avatar'), uploadAvatar);

export default route;
