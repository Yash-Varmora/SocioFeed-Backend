import { suggestHashtagsService } from '../services/hashtag.service.js';
import { sendResponse } from '../helpers/response.js';

const suggestHashtags = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const hashtags = await suggestHashtagsService(query);
    return sendResponse(res, 200, 'SUCCESS', 'Hashtag suggestions fetched successfully', hashtags);
  } catch (error) {
    console.error('Suggest hashtags error:', error);
    return next(error);
  }
};

export { suggestHashtags };
