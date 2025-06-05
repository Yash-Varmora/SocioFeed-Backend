import bcrypt from 'bcrypt';
import prisma from '../configs/prisma.config.js';
import sendEmail from '../helpers/sendMail.js';
import verifyGoogleToken from '../helpers/googleAuth.js';
import { generateAccessToken, generateRefreshToken, storeRefreshToken } from './token.service.js';
import crypto from 'crypto';
import { CustomError } from '../helpers/response.js';
import config from '../constants/config.js';

const register = async ({ email, username, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      isActive: false,
    },
  });

  const activationToken = crypto.randomBytes(32).toString('hex');
  await prisma.token.create({
    data: {
      userId: user.id,
      token: activationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const activationLink = `${config.FRONTEND_URL}/activate?token=${activationToken}`;
  await sendEmail({
    to: email,
    subject: 'Activate Your SocioFeed Account',
    text: `Click here to activate: ${activationLink}`,
    html: `<p>Click <a href="${activationLink}">here</a> to activate your account.</p>`,
  });

  return user;
};

const login = async ({ emailOrUsername, password }) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      isActive: true,
    },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new CustomError(400, 'Invalid credentials');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await storeRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken };
};

const googleLogin = async googleToken => {
  const { email, username, avatarUrl } = await verifyGoogleToken(googleToken);
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        username: username.replace(/\s/g, '').toLowerCase() + crypto.randomBytes(4).toString('hex'),
        avatarUrl,
        isActive: true,
        isGoogleLogin: true,
      },
    });
  } else if (!user.isActive) {
    user = await prisma.user.update({
      where: { email },
      data: { isActive: true, isGoogleLogin: true },
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await storeRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken };
};

const activate = async token => {
  const activateToken = await prisma.token.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
  });
  if (!activateToken) {
    throw new CustomError(400, 'Invalid token');
  }

  const user = await prisma.user.update({
    where: { id: activateToken.userId },
    data: { isActive: true },
  });

  await prisma.token.deleteMany({ where: { token } });
  return user;
};

const forgotPassword = async email => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new CustomError(400, 'User not found');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  await prisma.token.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetLink = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: email,
    subject: 'Reset Your SocioFeed Password',
    text: `Click here to reset: ${resetLink}`,
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
  });
};

const resetPassword = async (token, newPassword) => {
  const resetPasswordToken = await prisma.token.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
  });
  if (!resetPasswordToken) {
    throw new CustomError(400, 'Invalid token');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: resetPasswordToken.userId },
    data: { password: hashedPassword },
  });

  await prisma.token.deleteMany({ where: { token } });
};

const currentUser = async id => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      bio: true,
      totalFollowers: true,
      totalFollowing: true,
      createdAt: true,
    },
  });
  if (!user) {
    throw new CustomError(404, 'User not Found');
  }
  return user;
};

export { register, login, googleLogin, activate, forgotPassword, resetPassword, currentUser };
