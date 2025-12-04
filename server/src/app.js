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

const app = express();

// 프록시/로드밸런서 뒤에서 실제 클라이언트 IP를 얻기 위함
app.set('trust proxy', 1);

// 임시: IP 확인용 로그 (확인 후 제거하세요)
// app.use((req, _res, next) => {
//   console.log('req.ip:', req.ip, 'x-forwarded-for:', req.headers['x-forwarded-for']);
//   next();
// });

// Helmet 보안 헤더 설정
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // CSP는 리소스 허용에 맞춰 조정 필요
}));

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : [];
const previewPattern = process.env.PREVIEW_ORIGIN_PATTERN; // 예: "-project.vercel.app"
const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'production';

app.use(cors({
  origin: (origin, callback) => {
    // 媛쒕컻?섍꼍 (origin ?놁쓬)
    if (!origin) {
      return callback(null, true);
    }
    // 紐낆떆?곸쑝濡??덉슜??origin
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Vercel ?꾨━酉??꾨찓???먮룞 ?덉슜 (earth-shins-projects.vercel.app)
    if (appEnv === 'preview' && previewPattern && origin.endsWith(previewPattern)) {
      return callback(null, true);
    }
    callback(new Error('CORS not allowed'));
  },
  credentials: true
}));
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
  res.status(404).json({ message: `${req.originalUrl} 寃쎈줈瑜?李얠쓣 ???놁뒿?덈떎.` });
});

app.use((error, _req, res, _next) => {
  console.error('[error]', error);
  const status = error.status || 500;
  const message = error.message || '?쒕쾭 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.';
  res.status(status).json({ message });
});

module.exports = app;




