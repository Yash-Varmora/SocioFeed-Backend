import { sendResponse } from '../helpers/response.js';
import { getNotificationsService } from '../services/notification.service.js';

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const notifications = await getNotificationsService(userId);
    return sendResponse(res, 200, 'SUCCESS', 'Notifications fetched successfully', notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    next(error);
  }
};

export { getNotifications };
