require('dotenv').config();
const http = require('http');

const app = require('./app');
const { connectDatabase } = require('./config/database');
const { config } = require('./config/env');

const PORT = config.port;
const MONGODB_URI = config.mongoUri;

async function bootstrap() {
  try {
    await connectDatabase(MONGODB_URI);

    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error('서버 시작에 실패했습니다.', error.message);
    process.exit(1);
  }
}

bootstrap();
