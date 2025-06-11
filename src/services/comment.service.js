import prisma from '../configs/prisma.config.js';
import { createNotification } from '../helpers/createNotification.js';
import { CustomError } from '../helpers/response.js';

const createCommentService = async (userId, postId, parentCommentId, content, taggedUserIdsRaw) => {
  if (!content || !postId) {
    throw new CustomError(400, 'Content and postId are required');
  }

  let validTaggedUserIds = [];
  if (taggedUserIdsRaw) {
    const parsedIds = JSON.parse(taggedUserIdsRaw);
    if (Array.isArray(parsedIds)) {
      const users = await prisma.user.findMany({
        where: { id: { in: parsedIds } },
        select: { id: true },
      });
      validTaggedUserIds = users.map(user => user.id);
    }
  }

  const comment = await prisma.$transaction(async prisma => {
    const newComment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId,
        parentCommentId: parentCommentId || null,
        tagsInComments: {
          create: validTaggedUserIds.map(taggedId => ({
            userId: taggedId,
          })),
        },
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        tagsInComments: { include: { user: { select: { id: true, username: true } } } },
        commentLikes: { select: { userId: true } },
      },
    });

    if (!parentCommentId) {
      await prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });
    }

    return newComment;
  });

  for (const taggedId of validTaggedUserIds) {
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: taggedId },
    });
    if (
      (preferences?.notifyOnPostComment || preferences?.notifyOnPostComment === undefined) &&
      taggedId !== userId
    ) {
      await createNotification({
        type: 'TAG_IN_COMMENT',
        userId: taggedId,
        actorId: userId,
        postId,
        commentId: comment.id,
      });
    }
  }

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
  if (post.userId !== userId) {
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: post.userId },
    });
    if (preferences?.notifyOnPostComment || preferences?.notifyOnPostComment === undefined) {
      await createNotification({
        type: 'POST_COMMENT',
        userId: post.userId,
        actorId: userId,
        postId,
        commentId: comment.id,
      });
    }
  }

  return comment;
};
const editCommentService = async (userId, commentId, content) => {
  if (!content) {
    throw new CustomError(400, 'Content is required');
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment || comment.userId !== userId) {
    throw new CustomError(403, 'Unauthorized or comment not found');
  }

  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      tagsInComments: { include: { user: { select: { id: true, username: true } } } },
      commentLikes: { select: { userId: true } },
    },
  });
};

const deleteCommentService = async (userId, commentId) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true, postId: true, parentCommentId: true },
  });

  if (!comment || comment.userId !== userId) {
    throw new CustomError(403, 'Unauthorized or comment not found');
  }

  await prisma.$transaction(async prisma => {
    const getDescendantIds = async commentId => {
      const children = await prisma.comment.findMany({
        where: { parentCommentId: commentId },
        select: { id: true },
      });
      let ids = [commentId];
      for (const child of children) {
        ids = ids.concat(await getDescendantIds(child.id));
      }
      return ids;
    };

    const commentIds = await getDescendantIds(commentId);

    await prisma.commentLike.deleteMany({ where: { commentId: { in: commentIds } } });
    await prisma.tagInComment.deleteMany({ where: { commentId: { in: commentIds } } });
    await prisma.notification.deleteMany({ where: { commentId: { in: commentIds } } });
    await prisma.comment.deleteMany({ where: { id: { in: commentIds } } });

    if (!comment.parentCommentId) {
      await prisma.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: commentIds.length } },
      });
    }
  });
};

const getCommentsService = async (postId, parentCommentId, page) => {
  const pageNumber = parseInt(page, 10) || 1;
  const pageSize = 20;

  const whereClause = { postId };
  if (parentCommentId) {
    whereClause.parentCommentId = parentCommentId;
  } else {
    whereClause.parentCommentId = null;
  }

  const [total, comments] = await Promise.all([
    prisma.comment.count({ where: whereClause }),
    prisma.comment.findMany({
      where: whereClause,
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        tagsInComments: { include: { user: { select: { id: true, username: true } } } },
        commentLikes: { select: { userId: true } },
        childComments: { select: { id: true } },
      },
    }),
  ]);

  return {
    comments,
    page: pageNumber,
    pages: Math.ceil(total / pageSize),
    total,
  };
};

const likeCommentService = async (userId, commentId) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true, postId: true },
  });

  if (!comment) {
    throw new CustomError(404, 'Comment not found');
  }

  const existingLike = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (existingLike) {
    throw new CustomError(400, 'Comment already liked');
  }

  await prisma.$transaction(async prisma => {
    await prisma.commentLike.create({
      data: { userId, commentId },
    });

    if (comment.userId !== userId) {
      const preferences = await prisma.notificationPreferences.findUnique({
        where: { userId: comment.userId },
      });
      if (
        preferences?.notifyOnCommentLike ||
        (preferences?.notifyOnCommentLike === undefined && true)
      ) {
        await createNotification({
          type: 'COMMENT_LIKE',
          userId: comment.userId,
          actorId: userId,
          postId: comment.postId,
          commentId,
        });
      }
    }
  });
};

const unlikeCommentService = async (userId, commentId) => {
  const existingLike = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (!existingLike) {
    throw new CustomError(400, 'Comment not liked');
  }

  await prisma.commentLike.delete({
    where: { userId_commentId: { userId, commentId } },
  });
};

export {
  createCommentService,
  editCommentService,
  deleteCommentService,
  getCommentsService,
  likeCommentService,
  unlikeCommentService,
};
