import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { apiRequest } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';

const DEFAULT_SHIPPING_FEE = 3000;
const PORTONE_STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID ?? '';
const PORTONE_CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY ?? '';
const CHECKOUT_STORAGE_KEY = 'checkout:payload';

const PAY_METHOD_MAP = {
  card: 'CARD',
  bank_transfer: 'TRANSFER',
  virtual_account: 'VIRTUAL_ACCOUNT',
  mobile: 'MOBILE',
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
  const [portoneReady, setPortoneReady] = useState(false);
  const [moduleStatus, setModuleStatus] = useState('결제 모듈을 불러오는 중입니다...');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true, state: { from: '/checkout' } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!PORTONE_STORE_ID || !PORTONE_CHANNEL_KEY) {
      setModuleStatus('포트원 설정이 올바르지 않습니다.');
      setPortoneReady(false);
      return;
    }

    const existing = window.PortOne;
    if (existing) {
      setPortoneReady(true);
      setModuleStatus('결제 모듈이 준비되었습니다.');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.portone.io/v2/browser-sdk.js';
    script.async = true;
    script.onload = () => {
      if (window.PortOne) {
        setPortoneReady(true);
        setModuleStatus('결제 모듈이 준비되었습니다.');
      }
    };
    script.onerror = () => {
      setPortoneReady(false);
      setModuleStatus('결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    };
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        // 이미 제거됨
      }
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
        setError(err.message ?? '주문 정보를 불러오지 못했습니다.');
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
      setError('장바구니가 비어 있습니다.');
      return;
    }

    if (!shipping.recipientName || !shipping.phone || !shipping.postalCode || !shipping.addressLine1) {
      setError('배송지 필수 정보를 입력해주세요.');
      return;
    }

    if (!portoneReady || typeof window.PortOne === 'undefined') {
      setError('결제 모듈이 아직 준비 중입니다. 잠시 후 다시 시도해주세요.');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);

    const orderId = `order_${Date.now()}`;
    const payMethodV2 = PAY_METHOD_MAP[paymentMethod] ?? 'CARD';
    const redirectUrl = `${window.location.origin}/orders/complete`;

    // 모바일 리디렉트 대비 주문 정보 저장
    try {
      window.sessionStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify({
          shipping,
          pricing: {
            subtotal,
            discount,
            shippingFee,
            total,
          },
          payment: {
            method: paymentMethod,
          },
        }),
      );
    } catch (_error) {
      // storage 실패는 무시
    }

    try {
      console.log('[Checkout] 결제 요청 시작:', {
        orderId,
        total,
        paymentMethod: payMethodV2,
      });

      const response = await window.PortOne.requestPayment({
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_CHANNEL_KEY,
        paymentId: orderId,
        orderName: `종이책 연구소 주문 (${cart.length}건)`,
        totalAmount: total,
        currency: 'KRW',
        payMethod: payMethodV2,
        customer: {
          fullName: shipping.recipientName,
          phoneNumber: shipping.phone,
          email: user?.email,
        },
        redirectUrl,
      });

      console.log('[Checkout] 결제 응답:', response);

      if (response.code != null) {
        // 오류 발생
        console.error('[Checkout] 결제 오류:', response);
        setSubmitting(false);
        setError(response.message || '결제가 취소되었습니다.');
        return;
      }

      // 결제 성공 - 주문 생성
      try {
        // 디버깅: orderId 값 확인
        console.log('[Checkout] orderId 값:', orderId);
        console.log('[Checkout] paymentMethod 값:', paymentMethod);
        console.log('[Checkout] response 객체:', response);

        // undefined 값 필터링
        const paymentData = {
          method: paymentMethod,
          paymentId: orderId, // V2에서는 우리가 생성한 orderId를 paymentId로 사용
        };

        // transactionType과 txId가 있을 경우에만 추가
        if (response.transactionType) {
          paymentData.transactionType = response.transactionType;
        }
        if (response.txId) {
          paymentData.txId = response.txId;
        }

        const orderPayload = {
          shipping,
          payment: paymentData,
          pricing: {
            subtotal,
            discount,
            shippingFee,
            total,
          },
        };

        console.log('[Checkout] 주문 생성 요청 - 전체 payload:', JSON.stringify(orderPayload, null, 2));
        console.log('[Checkout] 주문 생성 요청 - payment 객체:', orderPayload.payment);
        console.log('[Checkout] orderId 최종 확인:', orderId);
        console.log('[Checkout] paymentId 최종 확인:', paymentData.paymentId);

        const order = await apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify(orderPayload),
        });

        console.log('[Checkout] 주문 생성 성공:', order);
        setCartCount(0);
        try {
          window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
        } catch (_error) {
          // ignore
        }
        navigate('/orders/complete', { replace: true, state: { order } });
      } catch (err) {
        console.error('[Checkout] 주문 생성 실패:', err);
        setError(err.message ?? '주문 생성 중 문제가 발생했습니다.');
      } finally {
        setSubmitting(false);
      }
    } catch (err) {
      console.error('[Checkout] 결제 실패:', err);
      setSubmitting(false);
      setError(err.message || '결제 중 오류가 발생했습니다.');
    }
  };

  const handleBackToCart = () => navigate('/', { state: { focus: 'cart' } });

  if (isLoadingCart || loading) {
    return (
      <div className="App checkout-page">
        <div className="checkout-status">주문 정보를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="App checkout-page">
        <div className="checkout-status error">장바구니가 비어 있어 주문을 진행할 수 없습니다.</div>
        <button type="button" className="detail-secondary" onClick={handleBackToCart}>
          장바구니로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="App checkout-page">
      <header className="checkout-header">
        <h1>주문 / 결제</h1>
        <p>주문 정보를 확인하고 배송지를 입력해주세요.</p>
      </header>

      <form className="checkout-grid" onSubmit={handleSubmit}>
        <section className="checkout-section">
          <h2>주문자 정보</h2>
          <div className="checkout-field">
            <span className="label">주문자</span>
            <span>{user?.name ?? user?.email}</span>
          </div>
          <div className="checkout-field">
            <span className="label">이메일</span>
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
              최근 배송지 사용
            </label>
            <label>
              <input
                type="radio"
                name="address-mode"
                checked={!useDefaultAddress}
                onChange={() => setUseDefaultAddress(false)}
              />
              새로운 배송지 입력
            </label>
          </div>

          <label className="checkout-input">
            수령인
            <input value={shipping.recipientName} onChange={updateShipping('recipientName')} required />
          </label>
          <label className="checkout-input">
            연락처
            <input value={shipping.phone} onChange={updateShipping('phone')} placeholder="010-0000-0000" required />
          </label>

          <div className="checkout-row">
            <label className="checkout-input">
              우편번호
              <input value={shipping.postalCode} onChange={updateShipping('postalCode')} required />
            </label>
            <button type="button" className="checkout-zipcode-btn" disabled>
              검색
            </button>
          </div>

          <label className="checkout-input">
            기본 주소
            <input value={shipping.addressLine1} onChange={updateShipping('addressLine1')} required />
          </label>
          <label className="checkout-input">
            상세 주소
            <input value={shipping.addressLine2} onChange={updateShipping('addressLine2')} />
          </label>

          <label className="checkout-input">
            배송 메모
            <textarea value={shipping.requestMessage} onChange={updateShipping('requestMessage')} placeholder="문 앞에 놓아주세요" />
          </label>
        </section>

        <section className="checkout-section">
          <h2>주문 상품</h2>
          <ul className="checkout-items">
            {cart.map((item) => (
              <li key={item.id} className="checkout-item">
                <div className="checkout-item__thumb">
                  {item.primaryImage?.url ? (
                    <img src={item.primaryImage.url} alt={item.name} />
                  ) : (
                    <span className="placeholder">이미지 없음</span>
                  )}
                </div>
                <div className="checkout-item__info">
                  <strong>{item.name}</strong>
                  <span>수량 {item.quantity}개</span>
                </div>
                <div className="checkout-item__price">₩ {item.price.toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="checkout-section">
          <h2>결제 요약</h2>
          <div className="checkout-summary">
            <div>
              <span>상품금액</span>
              <strong>₩ {subtotal.toLocaleString()}</strong>
            </div>
            <div>
              <span>할인금액</span>
              <strong>- ₩ {discount.toLocaleString()}</strong>
            </div>
            <div>
              <span>배송비</span>
              <strong>+ ₩ {shippingFee.toLocaleString()}</strong>
            </div>
            <div className="checkout-summary__total">
              <span>최종 결제 금액</span>
              <strong>₩ {total.toLocaleString()}</strong>
            </div>
          </div>
        </section>

        <section className="checkout-section">
          <h2>결제수단</h2>
          <div className="payment-options">
            {[
              { value: 'card', label: '카드 결제' },
              { value: 'bank_transfer', label: '계좌이체' },
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
            주문 내용을 확인했으며, 약관에 동의합니다.
          </label>

          {error && <div className="status error">{error}</div>}
          {!portoneReady && <div className="status">{moduleStatus}</div>}

          <div className="checkout-actions">
            <button type="button" className="detail-secondary" onClick={handleBackToCart}>
              장바구니로 돌아가기
            </button>
            <button type="submit" className="detail-primary" disabled={submitting || !portoneReady}>
              {submitting ? '주문 처리 중...' : `₩ ${total.toLocaleString()} 결제하기`}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

export default Checkout;
