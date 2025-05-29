export const sendResponse = (res, statuscode, status, message, data = {}) => {
  return res.status(statuscode).json({
    status,
    statuscode,
    message,
    data,
  });
};

export class CustomError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const errResponse = (err, req, res) => {
  return res.status(err.status || 500).json({
    status: 'ERROR',
    statuscode: err.status || 500,
    message: err.message || 'Server Error',
  });
};
