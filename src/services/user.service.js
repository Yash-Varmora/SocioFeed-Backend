import prisma from '../configs/prisma.config.js';

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

export { searchUsersService };
