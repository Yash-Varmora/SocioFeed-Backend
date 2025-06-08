import { PostVisibility } from '../../generated/prisma/client.js';
import prisma from '../configs/prisma.config.js';
import { uploadImage } from '../helpers/cloudinary.js';
import { createNotification } from '../helpers/createNotification.js';
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
        user: { select: { id: true, username: true, avatarUrl: true } },
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
  const postIds = posts.map(post => post.id);
  const [likes, saves] = await Promise.all([
    prisma.postLike.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    }),
    prisma.postSave.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    }),
  ]);

  const likedPostIds = new Set(likes.map(like => like.postId));
  const savedPostIds = new Set(saves.map(save => save.postId));

  const postsWithFlags = posts.map(post => ({
    ...post,
    isLike: likedPostIds.has(post.id),
    isSaved: savedPostIds.has(post.id),
  }));
  return {
    posts: postsWithFlags,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

const getPostService = async (postId, userId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      postMedia: true,
      tagsInPosts: {
        select: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      },
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

  const [like, save] = await Promise.all([
    prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      select: { postId: true },
    }),
    prisma.postSave.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      select: { postId: true },
    }),
  ]);

  return {
    ...post,
    isLike: !!like,
    isSaved: !!save,
  };
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

const likePostService = async (userId, postId) => {
  console.log(postId);
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });
  if (!post) {
    throw new CustomError(404, 'Post not found');
  }
  const existingLike = await prisma.postLike.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existingLike) {
    throw new CustomError(400, 'Post already liked');
  }
  await prisma.$transaction(async prisma => {
    await prisma.postLike.create({
      data: { userId, postId },
    });
    await prisma.post.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
    });
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: post.userId },
    });
    if (
      (preferences?.notifyOnPostLike || (preferences?.notifyOnNewFollower === undefined && true)) &&
      post.userId !== userId
    ) {
      await createNotification({
        type: 'POST_LIKE',
        userId: post.userId,
        actorId: userId,
        postId,
      });
    }
  });
};

const unlikePostService = async (userId, postId) => {
  const existingLike = await prisma.postLike.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (!existingLike) {
    throw new CustomError(404, 'Like not found');
  }

  await prisma.$transaction(async prisma => {
    await prisma.postLike.delete({
      where: { userId_postId: { userId, postId } },
    });
    await prisma.post.update({
      where: { id: postId },
      data: { likeCount: { decrement: 1 } },
    });
  });
};

const savePostService = async (userId, postId) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new CustomError(404, 'Post not found');
  }
  const existingSave = await prisma.postSave.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existingSave) {
    throw new CustomError(400, 'Post already saved');
  }
  await prisma.postSave.create({ data: { userId, postId } });
};

const unsavePostService = async (userId, postId) => {
  const existingSave = await prisma.postSave.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (!existingSave) {
    throw new CustomError(404, 'Saved post not found');
  }
  await prisma.postSave.delete({
    where: { userId_postId: { userId, postId } },
  });
};

const getPostLikesService = async (postId, query) => {
  const { page = '1', search = '' } = query;
  const pageNumber = parseInt(page, 10) || 1;
  const pageSize = 10;

  const total = await prisma.postLike.count({
    where: { postId, user: { username: { contains: search, mode: 'insensitive' } } },
  });
  const likes = await prisma.postLike.findMany({
    where: {
      postId,
      user: {
        username: { contains: search, mode: 'insensitive' },
      },
    },
    select: {
      user: {
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
      },
    },
    skip: (pageNumber - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: 'desc' },
  });
  return {
    users: likes.map(like => like.user),
    page: pageNumber,
    pages: Math.ceil(total / pageSize),
    total,
  };
};

const getSavedPostsService = async (userId, query) => {
  const { page = '1' } = query;
  const pageNumber = parseInt(page, 10) || 1;
  const pageSize = 10;

  const total = await prisma.postSave.count({ where: { userId } });

  const savedPosts = await prisma.postSave.findMany({
    where: { userId },
    skip: (pageNumber - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          postMedia: true,
          tagsInPosts: { include: { user: { select: { id: true, username: true } } } },
          postHashtags: {
            select: {
              hashtag: {
                select: { id: true, tag: true },
              },
            },
          },
        },
      },
    },
  });
  const posts = savedPosts.map(save => save.post);

  const postIds = posts.map(post => post.id);
  const [likes, saves] = await Promise.all([
    prisma.postLike.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    }),
    prisma.postSave.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    }),
  ]);

  const likedPostIds = new Set(likes.map(like => like.postId));
  const savedPostIds = new Set(saves.map(save => save.postId));

  const postsWithFlags = posts.map(post => ({
    ...post,
    isLike: likedPostIds.has(post.id),
    isSaved: savedPostIds.has(post.id),
  }));

  return {
    posts: postsWithFlags,
    page: pageNumber,
    pages: Math.ceil(total / pageSize),
    total,
  };
};

export {
  createPostService,
  getFeedService,
  getPostService,
  updatePostService,
  deletePostService,
  likePostService,
  unlikePostService,
  savePostService,
  unsavePostService,
  getPostLikesService,
  getSavedPostsService,
};
