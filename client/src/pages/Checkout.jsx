import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { apiRequest } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';

const DEFAULT_SHIPPING_FEE = 3000;
const PORTONE_CUSTOMER_CODE = import.meta.env.VITE_PORTONE_CUSTOMER_CODE ?? '';
const PG_PROVIDER = import.meta.env.VITE_PORTONE_PG ?? 'html5_inicis';
const PORTONE_PG_MID = import.meta.env.VITE_PORTONE_PG_MID ?? 'INIpayTest';

const PAY_METHOD_MAP = {
  card: 'card',
  bank_transfer: 'trans',
  virtual_account: 'vbank',
  mobile: 'phone',
};

function Checkout() {
  const navigate = useNavigate();
  const { user, loading, setCartCount } = useAuth();

  const [cart, setCart] = useState([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shipping, setShipping] = useState({
    recipientName: '',
    phone: '',
    postalCode: '',
    addressLine1: '',
    addressLine2: '',
    requestMessage: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [impReady, setImpReady] = useState(false);
  const [moduleStatus, setModuleStatus] = useState('결제 모듈??불러?�는 중입?�다...');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true, state: { from: '/checkout' } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!PORTONE_CUSTOMER_CODE) {
      setModuleStatus('?�트??고객???�별코드가 ?�정?��? ?�았?�니??');
      setImpReady(false);
      return;
    }

    const existing = window.IMP;
    if (existing) {
      existing.init(PORTONE_CUSTOMER_CODE);
      setImpReady(true);
      setModuleStatus('결제 모듈??준비되?�습?�다.');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.iamport.kr/v1/iamport.js';
    script.async = true;
    script.onload = () => {
      if (window.IMP) {
        window.IMP.init(PORTONE_CUSTOMER_CODE);
        setImpReady(true);
        setModuleStatus('결제 모듈??준비되?�습?�다.');
      }
    };
    script.onerror = () => {
      setImpReady(false);
      setModuleStatus('결제 모듈??불러?��? 못했?�니?? ?�시 ???�시 ?�도?�주?�요.');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (!user) return;
      setIsLoadingCart(true);
      setError('');
      try {
        const data = await apiRequest('/cart');
        setCart(data.items ?? []);
        if (data.items?.length) {
          setShipping((prev) => ({
            ...prev,
            recipientName: user.name ?? prev.recipientName,
            phone: user.phone ?? prev.phone,
            postalCode: user.addressPostalCode ?? prev.postalCode,
            addressLine1: user.addressLine1 ?? user.address ?? prev.addressLine1,
            addressLine2: user.addressLine2 ?? prev.addressLine2,
          }));
        }
      } catch (err) {
        setError(err.message ?? '주문 ?�보�?불러?��? 못했?�니??');
      } finally {
        setIsLoadingCart(false);
      }
    };

    bootstrap();
  }, [user]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const discount = 0;
  const shippingFee = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + ((item.shippingFee ?? DEFAULT_SHIPPING_FEE) * item.quantity),
        0,
      ),
    [cart],
  );
  const total = subtotal - discount + shippingFee;

  const updateShipping = (field) => (event) => {
    setShipping((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!cart.length) {
      setError('?�바구니가 비어 ?�습?�다.');
      return;
    }

    if (!shipping.recipientName || !shipping.phone || !shipping.postalCode || !shipping.addressLine1) {
      setError('배송지 ?�수 ?�보�??�력?�주?�요.');
      return;
    }

    if (!impReady || typeof window.IMP === 'undefined') {
      setError('결제 모듈???�직 준�?중입?�다. ?�시 ???�시 ?�도?�주?�요.');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);

    const merchantUid = `order_${Date.now()}`;
    const payMethod = PAY_METHOD_MAP[paymentMethod] ?? 'card';

    window.IMP.request_pay(
      {
        pg: `${PG_PROVIDER}.${PORTONE_PG_MID}`,
        pay_method: payMethod,
        merchant_uid: merchantUid,
        name: `종이�??�구??주문 (${cart.length}�?`,
        amount: total,
        buyer_email: user?.email ?? '',
        buyer_name: shipping.recipientName,
        buyer_tel: shipping.phone,
        buyer_addr: `${shipping.addressLine1} ${shipping.addressLine2 ?? ''}`.trim(),
        buyer_postcode: shipping.postalCode,
      },
      async (response) => {
        if (!response.success) {
          setSubmitting(false);
          setError(response.error_msg || '결제가 취소?�었?�니??');
          return;
        }

        try {
          const order = await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify({
              shipping,
              payment: {
                method: paymentMethod,
                impUid: response.imp_uid,
                merchantUid: response.merchant_uid,
                pgProvider: response.pg_provider,
                payMethod: response.pay_method,
                pgTid: response.pg_tid,
                cardName: response.card_name,
                applyNum: response.apply_num,
              },
              pricing: {
                subtotal,
                discount,
                shippingFee,
                total,
              },
            }),
          });

          setCartCount(0);
          navigate('/orders/complete', { replace: true, state: { order } });
        } catch (err) {
          setError(err.message ?? '주문 ?�성 �?문제가 발생?�습?�다.');
        } finally {
          setSubmitting(false);
        }
      },
    );
  };

  const handleBackToCart = () => navigate('/', { state: { focus: 'cart' } });

  if (isLoadingCart || loading) {
    return (
      <div className="App checkout-page">
        <div className="checkout-status">주문 ?�보�?불러?�는 중입?�다...</div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="App checkout-page">
        <div className="checkout-status error">?�바구니가 비어 ?�어 주문??진행?????�습?�다.</div>
        <button type="button" className="detail-secondary" onClick={handleBackToCart}>
          ?�바구니�??�아가�?        </button>
      </div>
    );
  }

  return (
    <div className="App checkout-page">
      <header className="checkout-header">
        <h1>주문 / 결제</h1>
        <p>주문 ?�보�??�인?�고 배송지�??�력?�주?�요.</p>
      </header>

      <form className="checkout-grid" onSubmit={handleSubmit}>
        <section className="checkout-section">
          <h2>주문???�보</h2>
          <div className="checkout-field">
            <span className="label">주문??/span>
            <span>{user?.name ?? user?.email}</span>
          </div>
          <div className="checkout-field">
            <span className="label">?�메??/span>
            <span>{user?.email}</span>
          </div>
        </section>

        <section className="checkout-section">
          <h2>배송지</h2>
          <div className="address-toggle">
            <label>
              <input
                type="radio"
                name="address-mode"
                checked={useDefaultAddress}
                onChange={() => setUseDefaultAddress(true)}
              />
              최근 배송지 ?�용
            </label>
            <label>
              <input
                type="radio"
                name="address-mode"
                checked={!useDefaultAddress}
                onChange={() => setUseDefaultAddress(false)}
              />
              ?�로??배송지 ?�력
            </label>
          </div>

          <label className="checkout-input">
            ?�령??            <input value={shipping.recipientName} onChange={updateShipping('recipientName')} required />
          </label>
          <label className="checkout-input">
            ?�락�?            <input value={shipping.phone} onChange={updateShipping('phone')} placeholder="010-0000-0000" required />
          </label>

          <div className="checkout-row">
            <label className="checkout-input">
              ?�편번호
              <input value={shipping.postalCode} onChange={updateShipping('postalCode')} required />
            </label>
            <button type="button" className="checkout-zipcode-btn" disabled>
              검??            </button>
          </div>

          <label className="checkout-input">
            기본 주소
            <input value={shipping.addressLine1} onChange={updateShipping('addressLine1')} required />
          </label>
          <label className="checkout-input">
            ?�세 주소
            <input value={shipping.addressLine2} onChange={updateShipping('addressLine2')} />
          </label>

          <label className="checkout-input">
            배송 메모
            <textarea value={shipping.requestMessage} onChange={updateShipping('requestMessage')} placeholder="�??�에 ?�아주세?? />
          </label>
        </section>

        <section className="checkout-section">
          <h2>주문 ?�품</h2>
          <ul className="checkout-items">
            {cart.map((item) => (
              <li key={item.id} className="checkout-item">
                <div className="checkout-item__thumb">
                  {item.primaryImage?.url ? (
                    <img src={item.primaryImage.url} alt={item.name} />
                  ) : (
                    <span className="placeholder">?��?지 ?�음</span>
                  )}
                </div>
                <div className="checkout-item__info">
                  <strong>{item.name}</strong>
                  <span>?�량 {item.quantity}�?/span>
                </div>
                <div className="checkout-item__price">??{item.price.toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="checkout-section">
          <h2>결제 ?�약</h2>
          <div className="checkout-summary">
            <div>
              <span>?�품금액</span>
              <strong>??{subtotal.toLocaleString()}</strong>
            </div>
            <div>
              <span>?�인금액</span>
              <strong>- ??{discount.toLocaleString()}</strong>
            </div>
            <div>
              <span>배송�?/span>
              <strong>+ ??{shippingFee.toLocaleString()}</strong>
            </div>
            <div className="checkout-summary__total">
              <span>최종 결제 금액</span>
              <strong>??{total.toLocaleString()}</strong>
            </div>
          </div>
        </section>

        <section className="checkout-section">
          <h2>결제?�단</h2>
          <div className="payment-options">
            {[
              { value: 'card', label: '카드 결제' },
              { value: 'bank_transfer', label: '계좌?�체' },
              { value: 'virtual_account', label: '가?�계�? },
              { value: 'mobile', label: '?��???결제' },
            ].map((option) => (
              <label key={option.value} className={`payment-option ${paymentMethod === option.value ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={() => setPaymentMethod(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>

          <label className="agreement">
            <input type="checkbox" required />
            주문 ?�용???�인?�으�? ?��????�의?�니??
          </label>

          {error && <div className="status error">{error}</div>}
          {!impReady && <div className="status">{moduleStatus}</div>}

          <div className="checkout-actions">
            <button type="button" className="detail-secondary" onClick={handleBackToCart}>
              ?�바구니�??�아가�?            </button>
            <button type="submit" className="detail-primary" disabled={submitting || !impReady}>
              {submitting ? '주문 처리 �?..' : `??${total.toLocaleString()} 결제?�기`}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

export default Checkout;
