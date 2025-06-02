import prisma from '../configs/prisma.config.js';
import { CustomError } from '../helpers/response.js';

const followUserService = async (followerId, followingId) => {
  if (followerId === followingId) {
    throw new CustomError(400, 'Cannot follow yourself');
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (existingFollow) {
    throw new CustomError(400, 'Already following this user');
  }

  await prisma.$transaction([
    prisma.follow.create({ data: { followerId, followingId } }),
    prisma.user.update({
      where: { id: followerId },
      data: { totalFollowing: { increment: 1 } },
    }),
    prisma.user.update({
      where: { id: followingId },
      data: { totalFollowers: { increment: 1 } },
    }),
  ]);
};

const unfollowUserService = async (followerId, followingId) => {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (!follow) {
    throw new CustomError(404, 'Not following this user');
  }

  await prisma.$transaction([
    prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    }),
    prisma.user.update({
      where: { id: followerId },
      data: { totalFollowing: { decrement: 1 } },
    }),
    prisma.user.update({
      where: { id: followingId },
      data: { totalFollowers: { decrement: 1 } },
    }),
  ]);
};

export { followUserService, unfollowUserService };
