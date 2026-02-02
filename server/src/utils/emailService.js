const nodemailer = require('nodemailer');

function buildTransportConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host) return null;

  const auth = user && pass ? { user, pass } : undefined;
  return { host, port, secure, auth };
}

function formatItemLine(item) {
  return `${item.name} (SKU: ${item.sku}) x${item.quantity} - ${item.price?.toLocaleString?.() ?? item.price}원`;
}

async function sendOrderNotification(order) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.MAIL_FROM || adminEmail;
  const transportConfig = buildTransportConfig();

  if (!adminEmail || !fromEmail || !transportConfig) {
    console.warn('[mailer] Missing ADMIN_EMAIL/MAIL_FROM/SMTP config. Skip sending.');
    return;
  }

  const transporter = nodemailer.createTransport(transportConfig);
  const items = (order.items || []).map(formatItemLine);
  const subject = `[주문 접수] ${order.id ?? order._id}`;

  const text = [
    `주문번호: ${order.id ?? order._id}`,
    `주문일: ${order.createdAt}`,
    `고객명: ${order.shipping?.recipientName ?? '-'}`,
    `연락처: ${order.shipping?.phone ?? '-'}`,
    `주소: ${order.shipping?.postalCode ?? ''} ${order.shipping?.addressLine1 ?? ''} ${order.shipping?.addressLine2 ?? ''}`.trim(),
    `결제금액: ${order.pricing?.total?.toLocaleString?.() ?? order.pricing?.total ?? '-' }원`,
    `결제상태: ${order.payment?.status ?? '-'}`,
    '주문상품:',
    ...items.map((line) => `- ${line}`),
  ].join('\n');

  const htmlItems = items.map((line) => `<li>${line}</li>`).join('');
  const html = `
    <h2>주문 접수 알림</h2>
    <p><strong>주문번호</strong>: ${order.id ?? order._id}</p>
    <p><strong>주문일</strong>: ${order.createdAt ?? '-'}</p>
    <p><strong>고객명</strong>: ${order.shipping?.recipientName ?? '-'}</p>
    <p><strong>연락처</strong>: ${order.shipping?.phone ?? '-'}</p>
    <p><strong>주소</strong>: ${order.shipping?.postalCode ?? ''} ${order.shipping?.addressLine1 ?? ''} ${order.shipping?.addressLine2 ?? ''}</p>
    <p><strong>결제금액</strong>: ${order.pricing?.total?.toLocaleString?.() ?? order.pricing?.total ?? '-' }원</p>
    <p><strong>결제상태</strong>: ${order.payment?.status ?? '-'}</p>
    <h3>주문상품</h3>
    <ul>${htmlItems}</ul>
  `;

  await transporter.sendMail({
    from: fromEmail,
    to: adminEmail,
    subject,
    text,
    html,
  });
}

module.exports = { sendOrderNotification };
