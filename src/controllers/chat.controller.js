import { sendResponse } from '../helpers/response.js';
import {
  createDirectChatService,
  createGroupChatService,
  getChatsService,
} from '../services/chat.service.js';

const getChats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const chats = await getChatsService(userId);
    return sendResponse(res, 200, 'SUCCESS', 'Chats fetched successfully', { chats });
  } catch (error) {
    console.error('Get chats error:', error);
    return next(error);
  }
};

const createDirectChat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { receiverId } = req.body;
    const chat = await createDirectChatService(userId, receiverId);
    return sendResponse(res, 200, 'SUCCESS', 'Direct chat created successfully', { chat });
  } catch (error) {
    console.error('Create direct chat error:', error);
    return next(error);
  }
};

const createGroupChat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, memberIds } = req.body;

    const chat = await createGroupChatService(userId, name, memberIds);
    return sendResponse(res, 201, 'SUCCESS', 'Group chat created successfully', { chat });
  } catch (error) {
    console.error('Create group chat error:', error);
    return next(error);
  }
};

export { getChats, createDirectChat, createGroupChat };
