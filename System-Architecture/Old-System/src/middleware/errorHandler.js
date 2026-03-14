const runtimeConfig = require('../config/runtime');

const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const requestId = req.requestId || 'unknown';

  console.error(
    JSON.stringify({
      level: 'error',
      event: 'request_failed',
      requestId,
      method: req.method,
      path: req.originalUrl,
      status,
      message: err.message,
      stack: runtimeConfig.nodeEnv === 'production' ? undefined : err.stack,
      timestamp: new Date().toISOString(),
    })
  );

  res.status(status).json({
    success: false,
    requestId,
    message: err.message || 'Internal Server Error',
    ...(runtimeConfig.nodeEnv !== 'production' ? { stack: err.stack } : {}),
  });
};

module.exports = errorHandler;
