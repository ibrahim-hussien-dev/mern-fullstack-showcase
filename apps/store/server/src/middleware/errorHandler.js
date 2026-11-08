export class AppError extends Error {
  constructor(status, message, code = 'ERROR', details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(_req, _res, next) {
  next(new AppError(404, 'Route not found', 'NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details;

  if (err instanceof AppError) {
    ({ status, message, code, details } = err);
  } else if (err.type === 'entity.too.large') {
    status = 413; message = 'Request body too large'; code = 'PAYLOAD_TOO_LARGE';
  } else if (err.type === 'entity.parse.failed') {
    status = 400; message = 'Invalid JSON body'; code = 'INVALID_JSON';
  } else if (err.name === 'CastError') {
    status = 400; message = 'Invalid identifier'; code = 'INVALID_ID';
  } else if (err.code === 11000) {
    status = 409; message = 'Duplicate value'; code = 'DUPLICATE';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401; message = 'Invalid or expired token'; code = 'INVALID_TOKEN';
  }

  if (status >= 500) console.error(err.stack || err.message);

  res.status(status).json({ error: { message, code, ...(details ? { details } : {}) } });
}
