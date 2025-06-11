import { CustomError, sendResponse } from '../helpers/response.js';
import {
  getFollowersService,
  getFollowingService,
  getMutualFriendsService,
  searchUsersService,
} from '../services/user.service.js';

const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.body;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    if (!query) {
      throw new CustomError(400, 'Query is required');
    }

    const result = await searchUsersService(query, page, limit);
    return sendResponse(res, 200, 'SUCCESS', 'search user Successful', result);
  } catch (error) {
    console.log('searchUser Error:', error.message);
    next(error);
  }
};

const getFollowers = async (req, res, next) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await getFollowersService(username, page, limit);

    if (!result) {
      throw new CustomError(400, 'User not found');
    }
    return sendResponse(res, 200, 'SUCCESS', 'get followers Successful', result);
  } catch (error) {
    console.error('Get followers error:', error);
    next(error);
  }
};

const getFollowing = async (req, res, next) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await getFollowingService(username, page, limit);

    if (!result) {
      throw new CustomError(400, 'User not found');
    }

    return sendResponse(res, 200, 'SUCCESS', 'get following Successful', result);
  } catch (error) {
    console.error('Get following error:', error);
    next(error);
  }
};

const getMutualFriends = async (req, res, next) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const mutualFriends = await getMutualFriendsService(currentUserId, username, page, limit);
    return sendResponse(res, 200, 'SUCCESS', 'Mutual Friend get Successfully', mutualFriends);
  } catch (error) {
    console.error('Mutual friends error:', error);
    return next(error);
  }
};

export { searchUsers, getFollowers, getFollowing, getMutualFriends };
