function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    status = 404;
    message = 'Resource not found';
  }
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || { field: '' })[0];
    message = field === 'email' ? 'An account with that email already exists' : `Duplicate value for ${field}`;
  }

  if (process.env.NODE_ENV !== 'production') console.error('[error]', message);
  res.status(status).json({ success: false, message });
}

/** Wraps async route handlers so rejected promises reach errorHandler. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { notFound, errorHandler, asyncHandler };
