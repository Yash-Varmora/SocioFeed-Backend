/* eslint-disable no-unused-vars */
import { CustomError, sendResponse } from '../helpers/response.js';
import {
  register,
  login,
  googleLogin,
  activate,
  forgotPassword,
  resetPassword,
  currentUser,
  logout,
} from '../services/auth.service.js';
import { setAuthCookies, clearAuthCookies } from '../services/token.service.js';

const registerController = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    await register({ email, username, password });
    return sendResponse(
      res,
      201,
      'SUCCESS',
      'Registration successful. Please check your email to activate.',
    );
  } catch (error) {
    console.log('registerController error', error.message);
    return next(error);
  }
};

const loginController = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;
    const { user, accessToken, refreshToken } = await login({ emailOrUsername, password });
    const { password: _, ...userdata } = user;
    setAuthCookies(res, accessToken, refreshToken);
    return sendResponse(res, 200, 'SUCCESS', 'Login successful', userdata);
  } catch (error) {
    console.log('loginController error', error.message);
    return next(error);
  }
};

const googleLoginController = async (req, res, next) => {
  try {
    const { token } = req.body;
    const { user, accessToken, refreshToken } = await googleLogin(token);
    setAuthCookies(res, accessToken, refreshToken);
    const { password: _, ...userdata } = user;
    return sendResponse(res, 200, 'SUCCESS', 'Login successful', userdata);
  } catch (error) {
    console.log('googleLoginController error', error.message);
    return next(error);
  }
};

const activateController = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await activate(token);
    const { password: _, ...userdata } = user;
    return sendResponse(res, 200, 'SUCCESS', 'Account activated', userdata);
  } catch (error) {
    console.log('activateController error', error.message);
    return next(error);
  }
};

const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;
    await forgotPassword(email);
    return sendResponse(res, 200, 'SUCCESS', 'Password reset email sent');
  } catch (error) {
    console.log('forgotPasswordController error', error.message);
    return next(error);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await resetPassword(token, newPassword);
    return sendResponse(res, 200, 'SUCCESS', 'Password reset successful');
  } catch (error) {
    console.log('resetPasswordController error', error.message);
    return next(error);
  }
};

const logoutController = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    await logout(refreshToken);
    clearAuthCookies(res);
    return sendResponse(res, 200, 'SUCCESS', 'Logged out successfully');
  } catch (error) {
    console.log('logoutController error', error.message);
    return next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await currentUser(id);
    return sendResponse(res, 200, 'SUCCESS', 'User data', user);
  } catch (error) {
    console.log('getCurrentUser error', error.message);
    return next(error);
  }
};

export {
  registerController,
  loginController,
  googleLoginController,
  activateController,
  forgotPasswordController,
  resetPasswordController,
  logoutController,
  getCurrentUser,
};
