import prisma from '../configs/prisma.config.js';
import { CustomError } from '../helpers/response.js';

const getMessagesService = async (userId, chatId, page) => {
  const pageNumber = parseInt(page, 10) || 1;
  const pageSize = 20;

  const isGroup = await prisma.chatGroup.findUnique({ where: { id: chatId } });
  let whereClause;

  if (isGroup) {
    whereClause = { groupId: chatId };
  } else {
    const [user1Id, user2Id] = chatId.split(':');
    if (![user1Id, user2Id].includes(userId)) {
      throw new CustomError(403, 'Unauthorized');
    }
    whereClause = {
      OR: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id },
      ],
    };
  }

  const [total, messages] = await Promise.all([
    prisma.message.count({ where: whereClause }),
    prisma.message.findMany({
      where: whereClause,
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    }),
  ]);

  return {
    messages: messages.reverse(),
    page: pageNumber,
    pages: Math.ceil(total / pageSize),
    total,
  };
};

export { getMessagesService };
