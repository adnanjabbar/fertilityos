const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'request_failed',
      requestId: req.requestId,
      statusCode,
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    })
  );

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    requestId: req.requestId,
  });
};

module.exports = errorHandler;
