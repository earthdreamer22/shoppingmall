const sensitivePatterns = [/^\/api\/auth\//, /^\/api\/admin/, /^\/api\/payments/];

const windows = {
  standard: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 5 * 60 * 1000),
  sensitive: Number(process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS ?? 60 * 60 * 1000),
};

const limits = {
  standard: Number(process.env.RATE_LIMIT_MAX ?? 300),
  sensitive: Number(process.env.RATE_LIMIT_SENSITIVE_MAX ?? 50),
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
  const sensitive = isSensitive(req.path);
  const windowMs = sensitive ? windows.sensitive : windows.standard;
  const max = sensitive ? limits.sensitive : limits.standard;
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
