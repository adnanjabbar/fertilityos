const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const parseNumber = (value, defaultValue) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const splitOrigins = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const runtimeConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseNumber(process.env.PORT, 3000),
  trustProxyHops: parseNumber(process.env.TRUST_PROXY_HOPS, 1),
  bodyLimit: process.env.BODY_LIMIT || '10mb',
  enableDbHealthcheck: parseBoolean(process.env.ENABLE_DB_HEALTHCHECK, true),
  apiRateLimit: {
    windowMs: parseNumber(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: parseNumber(process.env.API_RATE_LIMIT_MAX, 500),
  },
  cors: {
    allowAllOrigins: parseBoolean(process.env.CORS_ALLOW_ALL_ORIGINS, false),
    allowedOrigins: splitOrigins(process.env.CORS_ALLOWED_ORIGINS),
  },
};

module.exports = runtimeConfig;
