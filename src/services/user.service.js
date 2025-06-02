import prisma from '../configs/prisma.config.js';
import { CustomError } from '../helpers/response.js';

const searchUsersService = async (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
      skip,
      take: limit,
    }),
    prisma.user.count({
      where: {
        username: {
          contains: query,
          mode: 'insensitive',
        },
      },
    }),
  ]);

  return {
    users,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

const getMutualFriendsService = async (currentUserId, username) => {
  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!targetUser) {
    throw new CustomError(404, 'User not found');
  }

  const mutualFriends = await prisma.user.findMany({
    where: {
      AND: [
        { followsFollowing: { some: { followerId: currentUserId } } },
        { followsFollowing: { some: { followerId: targetUser.id } } },
      ],
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
    },
    take: 5,
  });
  console.log(mutualFriends);

  return mutualFriends;
};

export { searchUsersService, getMutualFriendsService };
