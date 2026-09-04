import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { apiRequest } from '../lib/apiClient.js';

const STATUS_LABELS = {
  pending: '결제 대기 / 입금 확인 중',
  paid: '결제 완료',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소됨',
};

function GuestOrderLookup() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setOrder(null);

    if (!orderId.trim() || !phone.trim()) {
      setError('주문번호와 연락처를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest('/orders/guest/lookup', {
        method: 'POST',
        body: JSON.stringify({ orderId: orderId.trim(), phone: phone.trim() }),
      });
      setOrder(result);
    } catch (err) {
      setError(err.message ?? '주문 조회 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const isBankTransfer = order?.payment?.method === 'bank_transfer';

  return (
    <div className="App checkout-page">
      <header className="checkout-header">
        <h1>비회원 주문조회</h1>
        <p>주문 시 안내된 주문번호와 주문자 연락처를 입력해주세요.</p>
      </header>

      <form className="checkout-section" onSubmit={handleSubmit}>
        <label className="checkout-input">
          주문번호
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="주문 완료 화면에 표시된 주문번호"
            required
          />
        </label>
        <label className="checkout-input">
          주문자 연락처
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="010-0000-0000"
            required
          />
        </label>
        {error && <div className="checkout-status error" style={{ marginTop: '12px' }}>{error}</div>}
        <div className="checkout-actions" style={{ marginTop: '16px' }}>
          <button type="submit" className="detail-primary" disabled={loading}>
            {loading ? '조회 중...' : '주문 조회'}
          </button>
        </div>
      </form>

      {order && (
        <>
          <section className="checkout-section">
            <h2>주문 상태</h2>
            <div className="checkout-field">
              <span className="label">주문번호</span>
              <span>{order.id}</span>
            </div>
            <div className="checkout-field">
              <span className="label">상태</span>
              <span>{STATUS_LABELS[order.status] ?? order.status}</span>
            </div>
            {isBankTransfer && order.status === 'pending' && (
              <p className="muted-text">입금이 확인되면 상태가 업데이트되고 상품이 발송됩니다.</p>
            )}
          </section>

          <section className="checkout-section">
            <h2>결제 요약</h2>
            <div className="checkout-summary">
              <div>
                <span>주문 금액</span>
                <strong>₩ {order.pricing?.subtotal?.toLocaleString?.() ?? '-'}</strong>
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
                    <span>수량 {item.quantity}개</span>
                  </div>
                  <div className="checkout-item__price">₩ {item.price?.toLocaleString?.()}</div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <div className="checkout-actions">
        <button type="button" className="detail-secondary" onClick={() => navigate('/')}>
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default GuestOrderLookup;
