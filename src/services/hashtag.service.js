import prisma from '../configs/prisma.config.js';

const suggestHashtagsService = async query => {
  return await prisma.hashtag.findMany({
    where: {
      tag: { contains: query.toLowerCase(), mode: 'insensitive' },
    },
    select: { id: true, tag: true, usageCount: true },
    orderBy: { usageCount: 'desc' },
    take: 10,
  });
};

export { suggestHashtagsService };
