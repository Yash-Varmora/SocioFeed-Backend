export const sendResponse = (res, statuscode, status, operation, data = {}) => {
  return res.status(statuscode).json({
    status,
    statuscode,
    operation,
    data,
  });
};

export const errResponse = (err, req, res) => {
  return res.status(err.status || 500).json({
    status: 'ERROR',
    statuscode: err.status || 500,
    message: err.message || 'Server Error',
  });
};
