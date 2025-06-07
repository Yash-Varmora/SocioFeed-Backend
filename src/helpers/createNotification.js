import prisma from '../configs/prisma.config.js';

export const createNotification = async ({ type, userId, actorId, postId }) => {
  await prisma.notification.create({
    data: {
      type,
      userId,
      actorId,
      postId,
    },
  });
};
