import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';

function OrderComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order ?? null;

  useEffect(() => {
    if (!order) {
      navigate('/', { replace: true });
    }
  }, [order, navigate]);

  if (!order) {
    return null;
  }

  return (
    <div className="App checkout-page">
      <header className="checkout-header">
        <h1>주문이 완료되었습니다</h1>
        <p>주문 번호: {order.id}</p>
      </header>

      <section className="checkout-section">
        <h2>결제 요약</h2>
        <div className="checkout-summary">
          <div>
            <span>주문 상품</span>
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
        <button type="button" className="detail-primary" onClick={() => navigate('/')}>쇼핑 계속하기</button>
      </div>
    </div>
  );
}

export default OrderComplete;
