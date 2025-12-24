import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';
import { apiRequest } from '../lib/apiClient.js';

const CHECKOUT_STORAGE_KEY = 'checkout:payload';

function clearStoredPayload() {
  try {
    window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  } catch (_error) {
    // ignore
  }
}

function loadStoredPayload() {
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function OrderComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(location.state?.order ?? null);
  const [status, setStatus] = useState(order ? '' : '결제 정보를 확인하는 중입니다.');
  const [error, setError] = useState('');
  const [extractedPaymentId, setExtractedPaymentId] = useState(null);

  useEffect(() => {
    if (order) {
      clearStoredPayload();
      return;
    }

    const params = new URLSearchParams(location.search);
    const paymentId = params.get('paymentId');
    const code = params.get('code');
    const message = params.get('message');

    // 디버깅: URL 파라미터 확인
    console.log('[OrderComplete] URL params:', {
      paymentId,
      code,
      message,
      fullURL: location.search,
      allParams: Object.fromEntries(params.entries()),
    });

    if (!paymentId) {
      console.error('[OrderComplete] paymentId 누락');
      const errorMsg = `결제 정보를 찾을 수 없습니다. URL: ${location.search}`;
      setError(errorMsg);
      setStatus('');
      // navigate('/', { replace: true }); // 디버깅을 위해 리디렉트 비활성화
      return;
    }

    // paymentId를 state로 저장
    setExtractedPaymentId(paymentId);

    if (code) {
      // 오류 발생
      setError(message || '결제가 취소되었습니다.');
      clearStoredPayload();
      return;
    }

    const payload = loadStoredPayload();
    if (!payload) {
      setError('결제 정보가 만료되었습니다. 다시 결제해주세요.');
      return;
    }

    const createOrder = async () => {
      // extractedPaymentId가 설정될 때까지 대기
      if (!extractedPaymentId) {
        console.log('[OrderComplete] extractedPaymentId 아직 설정 안됨, 대기 중...');
        return;
      }

      setStatus('주문을 생성하는 중입니다...');
      try {
        const orderPayload = {
          shipping: payload.shipping,
          pricing: payload.pricing,
          payment: {
            method: payload.payment?.method || 'card',
            paymentId: extractedPaymentId, // state에서 가져온 값 사용
          },
        };

        console.log('[OrderComplete] 주문 생성 요청:', orderPayload);

        const created = await apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify(orderPayload),
        });

        console.log('[OrderComplete] 주문 생성 성공:', created);
        setOrder(created);
        setError('');
        clearStoredPayload();
      } catch (err) {
        console.error('[OrderComplete] 주문 생성 실패:', err);
        setError(err.message ?? '주문 생성 중 오류가 발생했습니다.');
      } finally {
        setStatus('');
      }
    };

    createOrder();
  }, [order, location.search, navigate, payload, extractedPaymentId]);

  if (!order) {
    return (
      <div className="App checkout-page">
        <header className="checkout-header">
          <h1>결제 처리 중</h1>
          <p>{error || status || '결제 정보를 확인하는 중입니다.'}</p>
          {error && (
            <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', fontSize: '12px', wordBreak: 'break-all' }}>
              <strong>디버그 정보:</strong>
              <div>현재 URL: {window.location.href}</div>
              <div>Search params: {location.search}</div>
            </div>
          )}
        </header>
        <div className="checkout-actions">
          <button type="button" className="detail-secondary" onClick={() => navigate('/', { replace: true })}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App checkout-page">
      <header className="checkout-header">
        <h1>주문이 완료되었습니다.</h1>
        <p>주문 번호: {order.id}</p>
      </header>

      <section className="checkout-section">
        <h2>결제 요약</h2>
        <div className="checkout-summary">
          <div>
            <span>주문 금액</span>
            <strong>₩ {order.pricing?.subtotal?.toLocaleString?.() ?? '-'}</strong>
          </div>
          <div>
            <span>할인 금액</span>
            <strong>- ₩ {order.pricing?.discount?.toLocaleString?.() ?? '0'}</strong>
          </div>
          <div>
            <span>배송비</span>
            <strong>+ ₩ {order.pricing?.shippingFee?.toLocaleString?.() ?? '0'}</strong>
          </div>
          <div className="checkout-summary__total">
            <span>최종 결제 금액</span>
            <strong>₩ {order.pricing?.total?.toLocaleString?.() ?? '-'}</strong>
          </div>
        </div>
      </section>

      <section className="checkout-section">
        <h2>배송지 정보</h2>
        <div className="checkout-field">
          <span className="label">수령인</span>
          <span>{order.shipping?.recipientName}</span>
        </div>
        <div className="checkout-field">
          <span className="label">연락처</span>
          <span>{order.shipping?.phone}</span>
        </div>
        <div className="checkout-field">
          <span className="label">주소</span>
          <span>
            ({order.shipping?.postalCode}) {order.shipping?.addressLine1}
            {order.shipping?.addressLine2 ? `, ${order.shipping.addressLine2}` : ''}
          </span>
        </div>
      </section>

      <section className="checkout-section">
        <h2>주문 상품</h2>
        <ul className="checkout-items">
          {order.items?.map((item) => (
            <li key={item.id} className="checkout-item">
              <div className="checkout-item__thumb">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <span className="placeholder">이미지 없음</span>}
              </div>
              <div className="checkout-item__info">
                <strong>{item.name}</strong>
                <span>SKU {item.sku}</span>
                <span>수량 {item.quantity}개</span>
              </div>
              <div className="checkout-item__price">₩ {item.price?.toLocaleString?.()}</div>
            </li>
          ))}
        </ul>
      </section>

      <div className="checkout-actions">
        <button type="button" className="detail-primary" onClick={() => navigate('/')}>
          계속 쇼핑하기
        </button>
      </div>
    </div>
  );
}

export default OrderComplete;
