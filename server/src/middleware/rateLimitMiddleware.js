const { config } = require('../config/env');

const sensitivePatterns = [/^\/api\/auth\//, /^\/api\/admin/, /^\/api\/payments/];

const windows = {
  standard: config.rateLimit.windowMs,
  admin: config.rateLimit.adminWindowMs,
  sensitive: config.rateLimit.sensitiveWindowMs,
};

const limits = {
  standard: config.rateLimit.max,
  admin: config.rateLimit.adminMax,
  sensitive: config.rateLimit.sensitiveMax,
};

const bucket = new Map();

function now() {
  return Date.now();
}

function getKey(req, windowMs) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return `${ip}:${windowMs}:${req.path.startsWith('/api/admin') ? 'admin' : 'standard'}`;
}

function cleanExpired(key, windowMs) {
  const entry = bucket.get(key);
  if (entry && entry.expireAt < now()) {
    bucket.delete(key);
  }
}

function increment(key, windowMs) {
  const entry = bucket.get(key);
  if (!entry) {
    bucket.set(key, { count: 1, expireAt: now() + windowMs });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

function isSensitive(path) {
  return sensitivePatterns.some((pattern) => pattern.test(path));
}

function rateLimiter(req, res, next) {
  const isAdminPath = req.path.startsWith('/api/admin');
  const sensitive = isSensitive(req.path);

  const windowMs = isAdminPath ? windows.admin : sensitive ? windows.sensitive : windows.standard;
  const max = isAdminPath ? limits.admin : sensitive ? limits.sensitive : limits.standard;
  const key = getKey(req, windowMs);

  cleanExpired(key, windowMs);
  const count = increment(key, windowMs);

  if (count > max) {
    return res.status(429).json({ message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
  }

  return next();
}

module.exports = {
  rateLimiter,
};
