import prisma from '../configs/prisma.config.js';
import { CustomError } from '../helpers/response.js';

const getChatsService = async userId => {
  const directMessages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
      groupId: null,
    },
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
      receiver: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    distinct: ['senderId', 'receiverId'],
  });

  const directChats = directMessages.reduce((acc, msg) => {
    const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
    const [firstId, secondId] = [userId, otherUser.id].sort((a, b) => a.localeCompare(b));
    const chatId = `${firstId}:${secondId}`;
    if (!acc[chatId]) {
      acc[chatId] = {
        id: chatId,
        type: 'direct',
        user: otherUser,
        lastMessage: msg.content,
        lastActivityAt: msg.createdAt,
        unreadCount: 0,
      };
    }
    return acc;
  }, {});

  await Promise.all(
    Object.keys(directChats).map(async chatId => {
      const [user1Id, user2Id] = chatId.split(':');
      const otherUserId = user1Id === userId ? user2Id : user1Id;
      directChats[chatId].unreadCount = await prisma.message.count({
        where: {
          receiverId: userId,
          senderId: otherUserId,
          isRead: false,
        },
      });
    }),
  );

  const groupMembers = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          lastActivityAt: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true },
          },
        },
      },
    },
  });

  const groupChats = groupMembers.map(member => ({
    id: member.group.id,
    type: 'group',
    name: member.group.name,
    imageUrl: member.group.imageUrl,
    lastMessage: member.group.messages[0]?.content,
    lastActivityAt: member.group.lastActivityAt,
    unreadCount: 0,
  }));

  const chats = [...Object.values(directChats), ...groupChats].sort(
    (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
  );

  return chats;
};

const createDirectChatService = async (userId, receiverId) => {
  if (!receiverId) {
    throw new CustomError(400, 'Receiver ID required');
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    throw new CustomError(404, 'User not found');
  }

  const [firstId, secondId] = [userId, receiverId].sort((a, b) => a.localeCompare(b));
  const chatId = `${firstId}:${secondId}`;

  return { id: chatId, type: 'direct', user: receiver };
};

const createGroupChatService = async (userId, name, memberIds) => {
  if (!name || !Array.isArray(memberIds)) {
    throw new CustomError(400, 'Name and memberIds required');
  }

  const validMemberIds = await prisma.user
    .findMany({
      where: { id: { in: memberIds } },
      select: { id: true },
    })
    .then(users => users.map(user => user.id));

  if (validMemberIds.length !== memberIds.length) {
    throw new CustomError(400, 'Invalid member IDs');
  }

  const group = await prisma.chatGroup.create({
    data: {
      name,
      ownerId: userId,
      lastActivityAt: new Date(),
      groupMembers: {
        create: [{ userId, isAdmin: true }, ...validMemberIds.map(id => ({ userId: id }))],
      },
    },
    include: {
      groupMembers: { include: { user: { select: { id: true, username: true } } } },
    },
  });

  return { id: group.id, type: 'group', name: group.name };
};

export { getChatsService, createDirectChatService, createGroupChatService };
