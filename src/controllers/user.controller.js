import { CustomError, sendResponse } from '../helpers/response.js';
import { getMutualFriendsService, searchUsersService } from '../services/user.service.js';

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

const getMutualFriends = async (req, res, next) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.id;

    const mutualFriends = await getMutualFriendsService(currentUserId, username);
    console.log(mutualFriends);
    return sendResponse(res, 200, 'SUCCESS', 'Mutual Friend get Successfully', mutualFriends);
  } catch (error) {
    console.error('Mutual friends error:', error);
    return next(error);
  }
};

export { searchUsers, getMutualFriends };
