const User = require('../models/User');

async function resolveUserId(req) {
  if (req.user?.id) {
    return req.user.id;
  }

  if (process.env.ALLOW_DEMO_USER === 'true') {
    const demoEmail = process.env.DEMO_USER_EMAIL ?? 'demo@shoppingmall.local';
    const demoProfile = {
      name: process.env.DEMO_USER_NAME ?? '데모 사용자',
      email: demoEmail,
      address: process.env.DEMO_USER_ADDRESS ?? 'Seoul, Korea',
      phone: process.env.DEMO_USER_PHONE ?? '010-0000-0000',
    };

    const user = await User.findOneAndUpdate(
      { email: demoEmail },
      { $setOnInsert: demoProfile },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return user.id;
  }

  const error = new Error('인증 정보가 필요합니다.');
  error.status = 401;
  throw error;
}

module.exports = { resolveUserId };
