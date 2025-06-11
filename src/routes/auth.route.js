import { Router } from 'express';
import {
  registerController,
  loginController,
  googleLoginController,
  activateController,
  forgotPasswordController,
  resetPasswordController,
  logoutController,
  getCurrentUser,
} from '../controllers/auth.controller.js';
import {
  activateValidation,
  forgotPasswordValidation,
  googleLoginValidation,
  loginValidation,
  registerValidation,
  resetPasswordValidation,
} from '../validators/authValidators.js';
import validate from '../middleware/validators.js';
import verifyToken from '../middleware/authMiddleware.js';

const route = Router();

route.get('/me', verifyToken, getCurrentUser);
route.post('/register', registerValidation, validate, registerController);
route.post('/login', loginValidation, validate, loginController);
route.post('/google', googleLoginValidation, validate, googleLoginController);
route.post('/activate', activateValidation, validate, activateController);
route.post('/forgot-password', forgotPasswordValidation, validate, forgotPasswordController);
route.post('/reset-password', resetPasswordValidation, validate, resetPasswordController);
route.post('/logout', verifyToken, logoutController);

export default route;
