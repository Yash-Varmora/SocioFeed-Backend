import prisma from '../configs/prisma.config.js';

export const createNotification = async ({ type, userId, actorId, postId, commentId }) => {
  console.log(type, userId, actorId, postId, commentId);

  if (userId === actorId) {
    return null;
  }

  const result = await prisma.$transaction(async prisma => {
    const notification = await prisma.notification.create({
      data: {
        type,
        userId,
        actorId,
        postId: postId || null,
        commentId: commentId || null,
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalNotifications: { increment: 1 },
      },
    });

    return notification;
  });

  return result;
};
