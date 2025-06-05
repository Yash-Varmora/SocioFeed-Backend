import prisma from '../configs/prisma.config.js';
import { deleteImage, uploadImage } from '../helpers/cloudinary.js';
import { CustomError } from '../helpers/response.js';

const profile = async username => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
      totalFollowers: true,
      totalFollowing: true,
      createdAt: true,
      followsFollowing: {
        select: {
          followerId: true,
        },
      },
    },
  });
  if (!user) {
    throw new CustomError(404, 'User not Found');
  }
  return user;
};

const updateProfile = async (id, { username, bio }) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new CustomError(404, 'User not found');
  }

  const updateData = {};

  if (username && username !== existingUser.username) {
    const usernameTaken = await prisma.user.findUnique({ where: { username } });
    if (usernameTaken) {
      throw new CustomError(400, 'Username is already taken');
    }
    updateData.username = username;
  }

  if (bio !== undefined) updateData.bio = bio;

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
    },
  });
  return user;
};

const uploadUserAvatar = async (id, fileBuffer) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new CustomError(404, 'User not found');
  }

  const result = await uploadImage(fileBuffer, {
    folder: 'sociofeed/avatars',
  });

  if (user.avatarUrl) {
    const publicId = user.avatarUrl.split('/').pop().split('.')[0];
    await deleteImage(`sociofeed/avatars/${publicId}`);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { avatarUrl: result.secure_url },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
    },
  });
  return updatedUser;
};

const getUserPosts = async username => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    throw new CustomError(404, 'User not found');
  }

  const posts = await prisma.post.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      visibility: true,
      createdAt: true,
      likeCount: true,
      commentCount: true,
      postMedia: {
        select: {
          mediaUrl: true,
          mediaType: true,
          order: true,
        },
        orderBy: { order: 'asc' },
      },
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
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  return posts;
};

export { profile, updateProfile, uploadUserAvatar, getUserPosts };
