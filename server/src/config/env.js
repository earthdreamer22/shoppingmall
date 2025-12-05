const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET'];

const requireEnv = (key) => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

const numberEnv = (key, fallback) => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const num = Number(raw);
  return Number.isNaN(num) ? fallback : num;
};

const parseList = (value) =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Validate required variables early
REQUIRED_VARS.forEach(requireEnv);

const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'production';

const config = {
  appEnv,
  port: numberEnv('PORT', 5000),
  mongoUri: requireEnv('MONGODB_URI'),
  cors: {
    clientOrigins:
      parseList(process.env.CLIENT_ORIGIN) ||
      (appEnv !== 'production' ? DEFAULT_DEV_ORIGINS : []),
    previewPattern: process.env.PREVIEW_ORIGIN_PATTERN || null,
  },
  auth: {
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtExpiresMinutes: numberEnv('JWT_EXPIRES_MINUTES', 60),
    cookie: {
      sameSite: process.env.COOKIE_SAMESITE || 'strict',
      secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
      maxAgeMs: 60 * 60 * 1000,
    },
  },
  rateLimit: {
    windowMs: numberEnv('RATE_LIMIT_WINDOW_MS', 5 * 60 * 1000),
    adminWindowMs: numberEnv('RATE_LIMIT_ADMIN_WINDOW_MS', 5 * 60 * 1000),
    sensitiveWindowMs: numberEnv('RATE_LIMIT_SENSITIVE_WINDOW_MS', 60 * 60 * 1000),
    max: numberEnv('RATE_LIMIT_MAX', 300),
    adminMax: numberEnv('RATE_LIMIT_ADMIN_MAX', 500),
    sensitiveMax: numberEnv('RATE_LIMIT_SENSITIVE_MAX', 50),
  },
  portone: {
    impKey: requireEnv('PORTONE_IMP_KEY'),
    impSecret: requireEnv('PORTONE_IMP_SECRET'),
    webhookSecret: process.env.PORTONE_WEBHOOK_SECRET || '',
    isTestMode: process.env.NODE_ENV !== 'production',
  },
  adminInvite: {
    expiresHours: numberEnv('ADMIN_INVITE_EXPIRES_HOURS', 12),
  },
};

module.exports = { config };
