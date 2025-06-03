import prisma from '../configs/prisma.config.js';
import { CustomError } from '../helpers/response.js';

const searchUsersService = async (query, page = 1, limit = 2) => {
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

const getFollowersService = async (username, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!targetUser) {
    throw new CustomError(404, 'User not found');
  }

  const [followers, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        followsFollower: {
          some: { followingId: targetUser.id },
        },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        followsFollowing: {
          select: {
            followerId: true,
          },
        },
      },
      skip,
      take: limit,
    }),
    prisma.follow.count({
      where: { followingId: targetUser.id },
    }),
  ]);

  return {
    followers,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

const getFollowingService = async (username, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!targetUser) {
    throw new CustomError(404, 'User not found');
  }

  const [following, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        followsFollowing: {
          some: { followerId: targetUser.id },
        },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        followsFollowing: {
          select: {
            followerId: true,
          },
        },
      },
      skip,
      take: limit,
    }),
    prisma.follow.count({
      where: { followerId: targetUser.id },
    }),
  ]);

  return {
    following,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

const getMutualFriendsService = async (currentUserId, username, page, limit) => {
  const skip = (page - 1) * limit;
  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!targetUser) {
    throw new CustomError(404, 'User not found');
  }

  const [mutualFriends, total] = await Promise.all([
    await prisma.user.findMany({
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
        followsFollowing: {
          select: {
            followerId: true,
          },
        },
      },
      skip,
      take: limit,
    }),
    prisma.user.count({
      where: {
        AND: [
          {
            followsFollowing: {
              some: { followerId: currentUserId },
            },
          },
          {
            followsFollowing: {
              some: { followerId: targetUser.id },
            },
          },
        ],
      },
    }),
  ]);

  return {
    mutualFriends,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

export { searchUsersService, getFollowersService, getFollowingService, getMutualFriendsService };
