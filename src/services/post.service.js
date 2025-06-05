import { PostVisibility } from '../../generated/prisma/client.js';
import prisma from '../configs/prisma.config.js';
import { uploadImage } from '../helpers/cloudinary.js';
import { CustomError } from '../helpers/response.js';

const createPostService = async (userId, content, visibility, taggedUserIds, hashtags, files) => {
  if (!content) {
    throw new CustomError(400, 'Content is required');
  }
  if (!Object.values(PostVisibility).includes(visibility)) {
    throw new CustomError(400, 'Invalid visibility');
  }
  if (files?.length > 4) {
    throw new CustomError(400, 'Maximum 4 media files allowed');
  }

  const isVideo = files?.some(file => file.mimetype.startsWith('video'));
  if (isVideo && files.length > 1) {
    throw new CustomError(400, 'Only one video file is allowed per post');
  }
  const media = [];
  for (const [index, file] of files.entries()) {
    const result = await uploadImage(file.buffer, {
      resource_type: file.mimetype.startsWith('video') ? 'video' : 'image',
      folder: 'sociofeed/posts',
    });
    media.push({
      mediaUrl: result.secure_url,
      mediaType: file.mimetype.startsWith('video') ? 'video' : 'image',
      order: index,
    });
  }
  const post = await prisma.$transaction(async prisma => {
    const newPost = await prisma.post.create({
      data: {
        userId,
        content,
        visibility,
        postMedia: {
          create: media,
        },
        tagsInPosts: {
          create: taggedUserIds.map(taggedId => ({
            userId: taggedId,
          })),
        },
      },
      include: {
        user: { select: { username: true, avatarUrl: true } },
        postMedia: true,
        tagsInPosts: {
          include: {
            user: { select: { username: true } },
          },
        },
      },
    });
    for (const tag of hashtags) {
      const hashtag = await prisma.hashtag.upsert({
        where: { tag },
        update: { usageCount: { increment: 1 } },
        create: { tag, usageCount: 1 },
      });
      await prisma.postHashtag.create({
        data: {
          postId: newPost.id,
          hashtagId: hashtag.id,
        },
      });
    }
    if (taggedUserIds.length > 0) {
      await prisma.notification.createMany({
        data: taggedUserIds.map(taggedId => ({
          userId: taggedId,
          actorId: userId,
          type: 'TAG_IN_POST',
          postId: newPost.id,
        })),
      });
      await prisma.user.updateMany({
        where: { id: { in: taggedUserIds } },
        data: { totalNotifications: { increment: 1 } },
      });
    }
    return newPost;
  });
  return post;
};

const getFeedService = async (userId, page, limit) => {
  const skip = (page - 1) * limit;

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map(f => f.followingId);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'FRIENDS_ONLY', userId: { in: followingIds } },
          { userId },
        ],
      },
      include: {
        user: { select: { username: true, avatarUrl: true } },
        postMedia: true,
        postHashtags: {
          select: {
            hashtag: {
              select: {
                id: true,
                tag: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({
      where: {
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'FRIENDS_ONLY', userId: { in: followingIds } },
          { userId },
        ],
      },
    }),
  ]);

  return {
    posts,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

const getPostService = async (postId, userId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: { select: { username: true, avatarUrl: true } },
      postMedia: true,
    },
  });

  if (!post) {
    throw new CustomError(404, 'Post not found');
  }
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map(f => f.followingId);

  if (
    (post.visibility === 'PRIVATE' && post.userId !== userId) ||
    (post.visibility === 'FRIENDS_ONLY' &&
      !followingIds.includes(post.userId) &&
      post.userId !== userId)
  ) {
    throw new CustomError(403, 'Unauthorized to view post');
  }

  return post;
};

const updatePostService = async (postId, userId, content, visibility) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post) {
    throw new CustomError(404, 'Post not found');
  }
  if (post.userId !== userId) {
    throw new CustomError(403, 'Unauthorized to update post');
  }
  if (!Object.values(PostVisibility).includes(visibility)) {
    throw new CustomError(400, 'Invalid visibility');
  }
  return prisma.post.update({
    where: { id: postId },
    data: { content, visibility },
    include: {
      user: { select: { username: true, avatarUrl: true } },
      postMedia: true,
    },
  });
};

const deletePostService = async (postId, userId) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new CustomError(404, 'Post not found');
  if (post.userId !== userId) {
    throw new CustomError(403, 'Unauthorized');
  }

  await prisma.post.delete({ where: { id: postId } });
};

export { createPostService, getFeedService, getPostService, updatePostService, deletePostService };
