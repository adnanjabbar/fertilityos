const crypto = require('crypto');

const logger = (req, res, next) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                requestId,
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                durationMs: duration,
                userAgent: req.headers['user-agent'] || 'unknown'
            })
        );
    });

    next();
};

module.exports = logger;
