const os = require('os');

const parseIntOrDefault = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

module.exports = {
  appName: process.env.APP_NAME || 'FertilityOS',
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  port: parseIntOrDefault(process.env.PORT, 3000),
  health: {
    probeTimeoutMs: parseIntOrDefault(process.env.HEALTH_PROBE_TIMEOUT_MS, 1500),
  },
  host: {
    hostname: os.hostname(),
    platform: os.platform(),
    nodeVersion: process.version,
  },
};
