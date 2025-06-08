import { sendResponse } from '../helpers/response.js';
import {
  createCommentService,
  editCommentService,
  deleteCommentService,
  getCommentsService,
  likeCommentService,
  unlikeCommentService,
} from '../services/comment.service.js';

const createComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { postId, parentCommentId, content, taggedUserIds } = req.body;

    const comment = await createCommentService(
      userId,
      postId,
      parentCommentId,
      content,
      taggedUserIds,
    );
    return sendResponse(res, 201, 'SUCCESS', 'Comment created successfully', { comment });
  } catch (error) {
    console.error('Create comment error:', error);
    return next(error);
  }
};

const editComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { content } = req.body;

    const comment = await editCommentService(userId, id, content);
    return sendResponse(res, 200, 'SUCCESS', 'Comment updated successfully', { comment });
  } catch (error) {
    console.error('Edit comment error:', error);
    return next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await deleteCommentService(userId, id);
    return sendResponse(res, 204, 'SUCCESS', 'Comment deleted successfully');
  } catch (error) {
    console.error('Delete comment error:', error);
    return next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page = '1', parentCommentId } = req.query;

    const result = await getCommentsService(postId, parentCommentId, page);
    return sendResponse(res, 200, 'SUCCESS', 'Comments fetched successfully', result);
  } catch (error) {
    console.error('Get comments error:', error);
    return next(error);
  }
};

const likeComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await likeCommentService(userId, id);
    return sendResponse(res, 201, 'SUCCESS', 'Comment liked successfully');
  } catch (error) {
    console.error('Like comment error:', error);
    return next(error);
  }
};

const unlikeComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await unlikeCommentService(userId, id);
    return sendResponse(res, 200, 'SUCCESS', 'Comment unlike successfully');
  } catch (error) {
    console.error('Unlike comment error:', error);
    return next(error);
  }
};

export { createComment, editComment, deleteComment, getComments, likeComment, unlikeComment };
