const express = require('express');
const { query } = require('../config/database');
const config = require('../config/app.config');

const router = express.Router();
const startedAt = Date.now();

const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    }),
  ]);
};

router.get('/health/live', (req, res) => {
  res.json({
    status: 'ok',
    service: config.appName,
    environment: config.environment,
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/ready', async (req, res) => {
  try {
    await withTimeout(query('SELECT 1 AS connected'), config.health.probeTimeoutMs);

    res.json({
      status: 'ready',
      service: config.appName,
      version: config.version,
      environment: config.environment,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      host: config.host,
      timestamp: new Date().toISOString(),
      dependencies: {
        database: 'ok',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      service: config.appName,
      environment: config.environment,
      timestamp: new Date().toISOString(),
      dependencies: {
        database: 'unavailable',
      },
      error: error.message,
    });
  }
});

module.exports = router;
