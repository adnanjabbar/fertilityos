const logger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;

    const logPayload = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'http_request_completed',
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    console.log(JSON.stringify(logPayload));
  });

  next();
};

module.exports = logger;
