const resolveTenant = require('./middleware/tenant.middleware');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { getServerConfig, validateEnv } = require('./config/env');
const attachRequestContext = require('./middleware/request-context.middleware');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { liveness, readiness } = require('./controllers/health.controller');

validateEnv();
const serverConfig = getServerConfig();

const app = express();
app.set('trust proxy', 1);

app.use(attachRequestContext);
app.use(logger);

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));

// Body Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Files
app.use(express.static(path.join(__dirname, '../public')));

// Rate Limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: { error: 'Too many requests' } });
app.use('/api/', apiLimiter);

// Health Checks
app.get('/health', liveness);
app.get('/health/liveness', liveness);
app.get('/health/readiness', readiness);

// API Routes (Public + Auth)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/subscription', require('./routes/subscription.routes'));
app.use('/api/email', require('./routes/email.routes'));
app.use('/api/subscription-payment', require('./routes/subscription-payment.routes'));

// Tenant-scoped routes
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

// SPA Fallback
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

// 404 Handler
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found', requestId: req.requestId });
});

// Error Handler (must be last middleware)
app.use(errorHandler);

const server = app.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`Server running on ${serverConfig.host}:${serverConfig.port} (${serverConfig.nodeEnv})`);
});

const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  const forceExitTimer = setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, serverConfig.shutdownTimeoutMs);

  server.close(() => {
    clearTimeout(forceExitTimer);
    console.log('HTTP server closed. Shutdown complete.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
