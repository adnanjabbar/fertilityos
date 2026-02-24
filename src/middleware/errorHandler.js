const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;
    const payload = {
        success: false,
        message: err.message || 'Internal Server Error',
        requestId: req.requestId
    };

    if (process.env.NODE_ENV !== 'production' && err.stack) {
        payload.stack = err.stack;
    }

    console.error('🔥 ERROR:', {
        requestId: req.requestId,
        statusCode,
        message: err.message,
        stack: err.stack
    });

    res.status(statusCode).json(payload);
};

module.exports = errorHandler;
