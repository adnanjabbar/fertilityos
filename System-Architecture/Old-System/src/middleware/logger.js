const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'set-cookie', 'x-api-key']);

const sanitizeHeaders = (headers = {}) => {
  const sanitized = {};

  Object.entries(headers).forEach(([key, value]) => {
    sanitized[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? '[redacted]' : value;
  });

  return sanitized;
};

const logger = (req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  console.log(
    JSON.stringify({
      level: 'info',
      event: 'request_received',
      requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      headers: sanitizeHeaders(req.headers),
      timestamp: new Date().toISOString(),
    })
  );

  res.on('finish', () => {
    const durationMs = Date.now() - start;

    console.log(
      JSON.stringify({
        level: 'info',
        event: 'request_completed',
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        timestamp: new Date().toISOString(),
      })
    );
  });

  next();
};

module.exports = logger;
