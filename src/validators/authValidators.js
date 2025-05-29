import { body } from 'express-validator';

const registerValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Username must be alphanumeric'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

const loginValidation = [
  body('emailOrUsername').trim().notEmpty().withMessage('Email or username is required'),
  body('password').trim().notEmpty().withMessage('Password is required'),
];

const googleLoginValidation = [
  body('token').trim().notEmpty().withMessage('Google token is required'),
];

const activateValidation = [body('token').trim().notEmpty().withMessage('Token is required')];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
];

const resetPasswordValidation = [
  body('token').trim().notEmpty().withMessage('Token is required'),
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
];

export {
  registerValidation,
  loginValidation,
  googleLoginValidation,
  activateValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
