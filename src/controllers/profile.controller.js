import { CustomError, sendResponse } from '../helpers/response.js';
import {
  getUserPosts,
  profile,
  updateProfile,
  uploadUserAvatar,
} from '../services/profile.service.js';

const getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await profile(username);
    return sendResponse(res, 200, 'SUCCESS', 'Get Profile Successful', user);
  } catch (error) {
    console.log('GetProfile error', error.message);
    return next(error);
  }
};

const updateProfileController = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { username, bio } = req.body;
    const user = await updateProfile(id, { username, bio });
    return sendResponse(res, 200, 'SUCCESS', 'Update Profile Successful', user);
  } catch (error) {
    console.log('UpdateProfile error', error.message);
    return next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    const { id } = req.user;
    if (!req.file) {
      throw new CustomError(400, 'No file uploaded');
    }
    const updatedUser = await uploadUserAvatar(id, req.file.buffer);
    return sendResponse(res, 200, 'SUCCESS', 'Upload Avatar Successful', updatedUser);
  } catch (error) {
    console.log('UploadAvatar error', error.message);
    return next(error);
  }
};

const getUserPostsController = async (req, res, next) => {
  try {
    const { username } = req.params;
    const posts = await getUserPosts(username);
    return sendResponse(res, 200, 'SUCCESS', 'User posts fetched successfully', posts);
  } catch (error) {
    console.log('GetUserPosts error', error.message);
    return next(error);
  }
};

export { getProfile, updateProfileController, uploadAvatar, getUserPostsController };
