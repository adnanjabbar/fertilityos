const { pool } = require('../config/database');

const liveness = (req, res) => {
  res.json({
    status: 'ok',
    service: 'fertilityos-api',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

const readiness = async (req, res) => {
  const startedAt = Date.now();

  try {
    await pool.query('SELECT 1');

    return res.json({
      status: 'ready',
      checks: {
        database: 'ok',
      },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: 'not_ready',
      checks: {
        database: 'failed',
      },
      error: error.message,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = {
  liveness,
  readiness,
};
