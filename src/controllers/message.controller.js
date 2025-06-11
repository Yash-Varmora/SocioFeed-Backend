import { sendResponse } from '../helpers/response.js';
import { getMessagesService } from '../services/message.service.js';

const getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { page = '1' } = req.query;
    const result = await getMessagesService(userId, chatId, page);
    return sendResponse(res, 200, 'SUCCESS', 'Messages fetched successfully', result);
  } catch (error) {
    console.error('Get messages error:', error);
    return next(error);
  }
};

export { getMessages };
