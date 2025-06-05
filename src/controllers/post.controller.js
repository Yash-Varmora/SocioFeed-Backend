import { sendResponse } from '../helpers/response.js';
import {
  createPostService,
  deletePostService,
  getFeedService,
  getPostService,
  updatePostService,
} from '../services/post.service.js';

const createPost = async (req, res, next) => {
  try {
    const { content, visibility, taggedUserIds, hashtags } = req.body;

    const files = req.files;
    const userId = req.user.id;
    const taggedUsers = taggedUserIds ? JSON.parse(taggedUserIds) : [];
    const hashtagsArray = hashtags ? JSON.parse(hashtags) : [];
    console.log(hashtagsArray);
    const post = await createPostService(
      userId,
      content,
      visibility,
      taggedUsers,
      hashtagsArray,
      files,
    );
    return sendResponse(res, 201, 'SUCCESS', 'Post created successfully', post);
  } catch (error) {
    console.error('Create post error:', error);
    return next(error);
  }
};

const getFeed = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;

    const posts = await getFeedService(userId, page, limit);

    return sendResponse(res, 200, 'SUCCESS', 'Feed fetched successfully', posts);
  } catch (error) {
    console.error('Get feed error:', error);
    return next(error);
  }
};

const getPost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const post = await getPostService(postId, userId);
    return sendResponse(res, 200, 'SUCCESS', 'Post fetched successfully', post);
  } catch (error) {
    console.error('Get post error:', error);
    return next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { content, visibility } = req.body;

    const updatedPost = await updatePostService(postId, userId, content, visibility);
    return sendResponse(res, 200, 'SUCCESS', 'Post updated successfully', updatedPost);
  } catch (error) {
    console.error('Update post error:', error);
    return next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    await deletePostService(postId, userId);
    return sendResponse(res, 200, 'SUCCESS', 'Post deleted successfully');
  } catch (error) {
    console.error('Delete post error:', error);
    return next(error);
  }
};

export { createPost, getFeed, getPost, updatePost, deletePost };
