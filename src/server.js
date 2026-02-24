const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const config = require('./config/app.config');

const resolveTenant = require('./middleware/tenant.middleware');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const db = require('./config/database');
const runtimeConfig = require('./config/runtime');

const app = express();
app.set('trust proxy', runtimeConfig.trustProxyHops);

const createCorsOptions = () => {
  if (runtimeConfig.cors.allowAllOrigins || runtimeConfig.cors.allowedOrigins.length === 0) {
    return { origin: true, credentials: true };
  }

  return {
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || runtimeConfig.cors.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
  };
};

app.use(logger);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors(createCorsOptions()));

app.use(express.json({ limit: runtimeConfig.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: runtimeConfig.bodyLimit }));
app.use(express.static(path.join(__dirname, '../public')));

const apiLimiter = rateLimit({
  windowMs: runtimeConfig.apiRateLimit.windowMs,
  max: runtimeConfig.apiRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests',
  },
});

app.use('/api/', apiLimiter);

app.get('/health', async (req, res) => {
  const payload = {
    status: 'ok',
    service: 'FertilityOS API',
    environment: runtimeConfig.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  if (!runtimeConfig.enableDbHealthcheck) {
    return res.status(200).json(payload);
  }

  try {
    await db.query('SELECT 1 AS healthy');
    return res.status(200).json({
      ...payload,
      database: 'ok',
    });
  } catch (error) {
    return res.status(503).json({
      ...payload,
      status: 'degraded',
      database: 'unavailable',
      error: 'Database healthcheck failed',
    });
  }
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/subscription', require('./routes/subscription.routes'));
app.use('/api/email', require('./routes/email.routes'));
app.use('/api/subscription-payment', require('./routes/subscription-payment.routes'));

app.use('/api', resolveTenant);
app.use('/api/patients', require('./routes/patient.routes'));
app.use('/api/cycles', require('./routes/cycle.routes'));
app.use('/api/embryos', require('./routes/embryo.routes'));
app.use('/api/lab', require('./routes/lab.routes'));
app.use('/api/lab', require('./routes/lab-tests.routes'));
app.use('/api/medical-history', require('./routes/medical-history.routes'));
app.use('/api/medications', require('./routes/medication.routes'));
app.use('/api/treatments', require('./routes/treatment.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/finance', require('./routes/finance.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/receipts', require('./routes/receipt.routes'));
app.use('/api/clinic', require('./routes/clinic.routes'));
app.use('/api/clinic', require('./routes/clinic-overview.routes'));
app.use('/api/countries', require('./routes/country.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/payments', require('./routes/payment.routes'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found', requestId: req.requestId });
});

app.use(errorHandler);

const PORT = runtimeConfig.port;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

const shutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    try {
      await db.pool.end();
      console.log('Database pool closed. Shutdown complete.');
      process.exit(0);
    } catch (error) {
      console.error('Error closing database pool during shutdown:', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
