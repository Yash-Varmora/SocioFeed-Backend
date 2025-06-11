import { sendResponse } from '../helpers/response.js';
import {
  createPostService,
  deletePostService,
  getFeedService,
  getPostLikesService,
  getPostService,
  getSavedPostsService,
  likePostService,
  savePostService,
  unlikePostService,
  unsavePostService,
  updatePostService,
} from '../services/post.service.js';

const createPost = async (req, res, next) => {
  try {
    const { content, visibility, taggedUserIds, hashtags } = req.body;

    const files = req.files;
    const userId = req.user.id;
    const taggedUsers = taggedUserIds ? JSON.parse(taggedUserIds) : [];
    const hashtagsArray = hashtags ? JSON.parse(hashtags) : [];
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
    const limit = parseInt(req.query.limit) || 20;

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

const likePost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    await likePostService(userId, postId);
    return sendResponse(res, 200, 'SUCCESS', 'Post liked successfully');
  } catch (error) {
    console.error('Like post error:', error);
    return next(error);
  }
};

const unlikePost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    await unlikePostService(userId, postId);
    return sendResponse(res, 200, 'SUCCESS', 'Post unlike successfully');
  } catch (error) {
    console.error('Unlike post error:', error);
    return next(error);
  }
};

const savePost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    await savePostService(userId, postId);
    return sendResponse(res, 200, 'SUCCESS', 'Post saved successfully');
  } catch (error) {
    console.error('Save post error:', error);
    return next(error);
  }
};

const unsavePost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    await unsavePostService(userId, postId);
    return sendResponse(res, 200, 'SUCCESS', 'Post unsaved successfully');
  } catch (error) {
    console.error('Unsave post error:', error);
    return next(error);
  }
};

const getPostLikes = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const query = req.query;

    const likes = await getPostLikesService(postId, query);
    return sendResponse(res, 200, 'SUCCESS', 'Post likes fetched successfully', likes);
  } catch (error) {
    console.error('Get post likes error:', error);
    return next(error);
  }
};

const getSavedPosts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const query = req.query;

    const result = await getSavedPostsService(userId, query);
    return sendResponse(res, 200, 'SUCCESS', 'Saved posts fetched successfully', result);
  } catch (error) {
    console.error('Get saved posts error:', error);
    return next(error);
  }
};

export {
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  getPostLikes,
  getSavedPosts,
};
