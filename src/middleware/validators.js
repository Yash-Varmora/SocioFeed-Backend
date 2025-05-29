import { validationResult } from 'express-validator';
import { CustomError } from '../helpers/response.js';

const validate = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(400, errors.array());
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

export default validate;
