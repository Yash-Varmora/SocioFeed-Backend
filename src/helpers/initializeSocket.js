import { Server } from 'socket.io';
import { corsOptions } from '../constants/config.js';
import { verifyAccessToken } from '../services/token.service.js';
import prisma from '../configs/prisma.config.js';

const initializeSocket = server => {
  const io = new Server(server, {
    cors: corsOptions,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.headers.cookie?.match(/accessToken=([^;]+)/)?.[1];
      if (!token) {
        return next(new Error('Authentication error'));
      }
      const decoded = await verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.data.user = user;
      next();
    } catch (error) {
      console.log(error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', socket => {
    console.log(`User ${socket.data.user.username} connected`);

    socket.on('join_chat', ({ chatId }) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${socket.data.user.username} joined chat:${chatId}`);
    });

    socket.on('leave_chat', ({ chatId }) => {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${socket.data.user.username} left chat:${chatId}`);
    });

    socket.on('send_message', async ({ chatId, content, isGroup, receiverId }) => {
      try {
        const senderId = socket.data.user.id;
        const message = await prisma.message.create({
          data: {
            content,
            senderId,
            receiverId: isGroup ? null : receiverId,
            groupId: isGroup ? chatId : null,
          },
          include: {
            sender: { select: { id: true, username: true, avatarUrl: true } },
          },
        });

        io.to(`chat:${chatId}`).emit('receive_message', message);

        if (isGroup) {
          const members = await prisma.groupMember.findMany({
            where: { groupId: chatId, userId: { not: senderId } },
            select: { userId: true },
          });
          for (const member of members) {
            const preferences = await prisma.notificationPreferences.findUnique({
              where: { userId: member.userId },
            });
            if (preferences?.notifyOnGroupMessage) {
              await prisma.notification.create({
                data: {
                  type: 'GROUP_MESSAGE',
                  userId: member.userId,
                  actorId: senderId,
                  groupId: chatId,
                },
              });
              io.to(`user:${member.userId}`).emit('notification', {
                type: 'GROUP_MESSAGE',
                chatId,
              });
            }
          }
        } else {
          const preferences = await prisma.notificationPreferences.findUnique({
            where: { userId: receiverId },
          });
          if (preferences?.notifyOnDirectMessage) {
            await prisma.notification.create({
              data: {
                type: 'DIRECT_MESSAGE',
                userId: receiverId,
                actorId: senderId,
              },
            });
            const [firstId, secondId] = [senderId, receiverId].sort((a, b) => a.localeCompare(b));
            const directChatId = `${firstId}:${secondId}`;
            io.to(`user:${receiverId}`).emit('notification', {
              type: 'DIRECT_MESSAGE',
              chatId: directChatId,
            });
          }
        }
      } catch (error) {
        console.error(error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('update_message', async ({ messageId, content }) => {
      try {
        if (!messageId || !content) {
          return socket.emit('error', { message: 'Message ID and content are required' });
        }

        const senderId = socket.data.user?.id;
        if (!senderId) {
          return socket.emit('error', { message: 'User authentication required' });
        }

        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: {
            id: true,
            senderId: true,
            createdAt: true,
            groupId: true,
            receiverId: true,
            content: true,
          },
        });

        if (!message || message.senderId !== senderId) {
          return socket.emit('error', { message: 'Unauthorized or message not found' });
        }

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (message.createdAt < fiveMinutesAgo) {
          return socket.emit('error', { message: 'Edit window has expired' });
        }

        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: { content: content.trim() },
          include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
        });

        const chatId = message.groupId
          ? message.groupId
          : `${[senderId, message.receiverId].sort((a, b) => a.localeCompare(b)).join(':')}`;
        io.to(`chat:${chatId}`).emit('message_updated', updatedMessage);
      } catch (error) {
        console.error(error);
        socket.emit('error', { message: 'Failed to update message' });
      }
    });

    socket.on('delete_message', async ({ messageId }) => {
      try {
        const senderId = socket.data.user.id;
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { senderId: true, groupId: true, receiverId: true },
        });

        if (!message || message.senderId !== senderId) {
          return socket.emit('error', { message: 'Unauthorized or message not found' });
        }

        await prisma.message.delete({ where: { id: messageId } });

        const chatId =
          message.groupId ||
          `${[senderId, message.receiverId].sort((a, b) => a.localeCompare(b)).join(':')}`;
        io.to(`chat:${chatId}`).emit('message_deleted', { messageId });
      } catch (error) {
        console.error(error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    socket.join(`user:${socket.data.user.id}`);

    socket.on('disconnect', () => {
      console.log(`User ${socket.data.user.username} disconnected`);
    });
  });

  return io;
};

export default initializeSocket;
