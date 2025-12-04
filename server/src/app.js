const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const productRoutes = require('./routes/productRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');
const adminInviteRoutes = require('./routes/adminInviteRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const { csrfProtection } = require('./middleware/csrfMiddleware');
const { rateLimiter } = require('./middleware/rateLimitMiddleware');
const { config } = require('./config/env');

const app = express();

// 신뢰 프록시 설정: X-Forwarded-For 등을 활용해 실제 클라이언트 IP 사용
app.set('trust proxy', 1);

const allowedOrigins = config.cors.clientOrigins;
const previewPattern = config.cors.previewPattern; // 예: "-project.vercel.app"
const appEnv = config.appEnv;

const cspDirectives = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  frameAncestors: ["'none'"],
  objectSrc: ["'none'"],
};

// Helmet 기본 헤더 + CSP/Referrer 적용
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: { useDefaults: true, directives: cspDirectives },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// Permissions-Policy: 불필요한 기기 권한 차단
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (appEnv === 'preview' && previewPattern && origin.endsWith(previewPattern)) {
        return callback(null, true);
      }
      callback(new Error('CORS not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(rateLimiter);
app.use(csrfProtection);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/products', productRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/invites', adminInviteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/schedules', scheduleRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `${req.originalUrl} 경로를 찾을 수 없습니다.` });
});

app.use((error, _req, res, _next) => {
  console.error('[error]', error);
  const status = error.status || 500;
  const message = error.message || '서버 오류가 발생했습니다.';
  res.status(status).json({ message });
});

module.exports = app;
