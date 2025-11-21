const mongoose = require('mongoose');

const DEFAULT_OPTIONS = {
  autoIndex: true,
};

async function connectDatabase(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI 환경변수가 설정되지 않았습니다.');
  }

  mongoose.connection.on('connected', () => {
    console.log('[database] MongoDB 연결 성공');
  });

  mongoose.connection.on('error', (error) => {
    console.error('[database] MongoDB 연결 오류', error);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[database] MongoDB 연결이 종료되었습니다.');
  });

  await mongoose.connect(uri, DEFAULT_OPTIONS);
}

module.exports = { connectDatabase };
