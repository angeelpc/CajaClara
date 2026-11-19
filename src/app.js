const path = require('path');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();
const publicDirectory = path.join(__dirname, '..', 'public');

const normalizeOrigin = (value = '') => value.trim().replace(/\/+$/, '');

const toHttpsOrigin = (value = '') => {
  const normalizedValue = normalizeOrigin(value);
  if (!normalizedValue) return '';
  return /^https?:\/\//i.test(normalizedValue)
    ? normalizedValue
    : `https://${normalizedValue}`;
};

const getAllowedOrigins = () => {
  const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
  const vercelOrigins = [
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ]
    .map(toHttpsOrigin)
    .filter(Boolean);

  return new Set([...configuredOrigins, ...vercelOrigins]);
};

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      scriptSrc: ["'self'"]
    }
  }
}));
app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    const requestOrigin = normalizeOrigin(origin);

    if (!origin || allowedOrigins.size === 0 || allowedOrigins.has(requestOrigin)) {
      return callback(null, true);
    }

    return callback(new Error('Origen no permitido por CORS.'));
  }
}));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Se realizaron demasiados intentos. Espera unos minutos.'
  }
});

app.get('/api/health', (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady || process.env.NODE_ENV === 'test' ? 200 : 503).json({
    success: databaseReady || process.env.NODE_ENV === 'test',
    service: 'CajaClara API',
    database: databaseReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use(express.static(publicDirectory, { extensions: ['html'] }));

app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
  res.sendFile(path.join(publicDirectory, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
