const resolveTenant = require('./middleware/tenant.middleware');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./config/database');
const { validateEnvironment, buildAppMetadata } = require('./config/appConfig');
require('dotenv').config();

validateEnvironment();
const appMeta = buildAppMetadata();

const app = express();
app.set('trust proxy', 1);
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
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
app.get('/health/live', (req, res) => {
    res.json({
        status: 'ok',
        service: appMeta.name,
        version: appMeta.version,
        environment: appMeta.environment,
        uptimeSeconds: Number(process.uptime().toFixed(2)),
        timestamp: new Date().toISOString()
    });
});

app.get('/health/ready', async (req, res, next) => {
    try {
        await db.query('SELECT 1');
        res.json({
            status: 'ready',
            dependencies: { database: 'up' },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        error.status = 503;
        error.message = `Readiness check failed: ${error.message}`;
        next(error);
    }
});

// Backward compatibility
app.get('/health', (req, res) => {
    res.redirect(301, '/health/live');
});

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
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Error Handler (must be last middleware)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => console.log('Server running on port ' + PORT));

const shutdownSignals = ['SIGINT', 'SIGTERM'];
shutdownSignals.forEach((signal) => {
    process.on(signal, () => {
        console.log(`Received ${signal}, shutting down server...`);
        server.close(() => {
            console.log('HTTP server closed');
            db.pool.end(() => {
                console.log('Database pool closed');
                process.exit(0);
            });
        });
    });
});

module.exports = app;
