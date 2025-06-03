import { sendResponse } from '../helpers/response.js';
import { followUserService, unfollowUserService } from '../services/follow.service.js';

const followUser = async (req, res, next) => {
  try {
    const { followingId } = req.body;
    const followerId = req.user.id;

    await followUserService(followerId, followingId);
    return sendResponse(res, 201, 'SUCCESS', 'Followed successfully');
  } catch (error) {
    console.error('Follow error:', error);
    return next(error);
  }
};

const unfollowUser = async (req, res, next) => {
  try {
    const { followingId } = req.params;
    const followerId = req.user.id;

    await unfollowUserService(followerId, followingId);
    return sendResponse(res, 200, 'SUCCESS', 'Unfollowed successfully');
  } catch (error) {
    console.error('Unfollow error:', error);
    return next(error);
  }
};

export { followUser, unfollowUser };
