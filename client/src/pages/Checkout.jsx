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
  // 배송비: 모든 상품 중 최대 배송비 1개만 적용 (주문 1건당 1회만 청구)
  const shippingFee = useMemo(
    () => {
      if (cart.length === 0) return 0;
      const maxFee = Math.max(...cart.map((item) => item.shippingFee ?? DEFAULT_SHIPPING_FEE));
      return maxFee;
    },
    [cart],
  );
  const total = subtotal - discount + shippingFee;
  const needsShipping = shippingFee > 0;

  const updateShipping = (field) => (event) => {
    setShipping((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // 주문 생성 공통 함수
  const createOrder = async (paymentData) => {
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

    console.log('[Checkout] 주문 생성 요청:', JSON.stringify(orderPayload, null, 2));

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
  };

  // 계좌이체 주문 처리
  const handleBankTransfer = async () => {
    setSubmitting(true);
    setError('');
    try {
      const orderId = `bank_${Date.now()}`;
      await createOrder({
        method: 'bank_transfer',
        paymentId: orderId,
      });
    } catch (err) {
      console.error('[Checkout] 계좌이체 주문 생성 실패:', err);
      setError(err.message ?? '주문 생성 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!cart.length) {
      setError('장바구니가 비어 있습니다.');
      return;
    }

    if (needsShipping && (!shipping.recipientName || !shipping.phone || !shipping.postalCode || !shipping.addressLine1)) {
      setError('배송지 필수 정보를 입력해주세요.');
      return;
    }

    // 계좌이체: PortOne 없이 바로 주문 생성
    if (paymentMethod === 'bank_transfer') {
      handleBankTransfer();
      return;
    }

    // 카드 결제: PortOne 사용
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
        console.error('[Checkout] 결제 오류:', response);
        setSubmitting(false);
        setError(response.message || '결제가 취소되었습니다.');
        return;
      }

      // 결제 성공 - 주문 생성
      try {
        const paymentData = {
          method: paymentMethod,
          paymentId: orderId,
        };
        if (response.transactionType) {
          paymentData.transactionType = response.transactionType;
        }
        if (response.txId) {
          paymentData.txId = response.txId;
        }
        await createOrder(paymentData);
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
          {!needsShipping && (
            <p className="muted-text">배송비가 0원인 상품은 배송지가 필요하지 않습니다.</p>
          )}
          <div className="address-toggle">
            <label>
              <input
                type="radio"
                name="address-mode"
                checked={useDefaultAddress}
                onChange={() => setUseDefaultAddress(true)}
                disabled={!needsShipping}
              />
              최근 배송지 사용
            </label>
            <label>
              <input
                type="radio"
                name="address-mode"
                checked={!useDefaultAddress}
                onChange={() => setUseDefaultAddress(false)}
                disabled={!needsShipping}
              />
              새로운 배송지 입력
            </label>
          </div>

          <label className="checkout-input">
            수령인
            <input
              value={shipping.recipientName}
              onChange={updateShipping('recipientName')}
              required={needsShipping}
              disabled={!needsShipping}
            />
          </label>
          <label className="checkout-input">
            연락처
            <input
              value={shipping.phone}
              onChange={updateShipping('phone')}
              placeholder="010-0000-0000"
              required={needsShipping}
              disabled={!needsShipping}
            />
          </label>

          <div className="checkout-row">
            <label className="checkout-input">
              우편번호
              <input
                value={shipping.postalCode}
                onChange={updateShipping('postalCode')}
                required={needsShipping}
                disabled={!needsShipping}
              />
            </label>
            <button type="button" className="checkout-zipcode-btn" disabled>
              검색
            </button>
          </div>

          <label className="checkout-input">
            기본 주소
            <input
              value={shipping.addressLine1}
              onChange={updateShipping('addressLine1')}
              required={needsShipping}
              disabled={!needsShipping}
            />
          </label>
          <label className="checkout-input">
            상세 주소
            <input
              value={shipping.addressLine2}
              onChange={updateShipping('addressLine2')}
              disabled={!needsShipping}
            />
          </label>

          <label className="checkout-input">
            배송 메모
            <textarea
              value={shipping.requestMessage}
              onChange={updateShipping('requestMessage')}
              placeholder="문 앞에 놓아주세요"
              disabled={!needsShipping}
            />
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

          {paymentMethod === 'bank_transfer' && (
            <div className="bank-transfer-info">
              <h3>입금 계좌 안내</h3>
              <div className="bank-transfer-detail">
                <div><span className="label">은행</span><strong>카카오뱅크</strong></div>
                <div><span className="label">계좌번호</span><strong>3333-03-3506699</strong></div>
                <div><span className="label">예금주</span><strong>신윤재(종이책연구소)</strong></div>
              </div>
              <p className="bank-transfer-notice">
                주문 후 위 계좌로 입금해주시면 확인후 상품은 발송됩니다. 수업은 따로 상품이 발송되지 않습니다.<br />
                입금자명은 주문자명과 동일하게 해주세요.<br /><br />
                계좌이체시 담당자에게 입금 확인 메세지나 전화를 통해서 입금확인 요청 부탁드립니다.<br />
                TEL : 0507-1371-9981
              </p>
            </div>
          )}

          <label className="agreement">
            <input type="checkbox" required />
            주문 내용을 확인했으며, 약관에 동의합니다.
          </label>

          {error && <div className="status error">{error}</div>}
          {paymentMethod !== 'bank_transfer' && !portoneReady && <div className="status">{moduleStatus}</div>}

          <div className="checkout-actions">
            <button type="button" className="detail-secondary" onClick={handleBackToCart}>
              장바구니로 돌아가기
            </button>
            <button type="submit" className="detail-primary" disabled={submitting || (paymentMethod !== 'bank_transfer' && !portoneReady)}>
              {submitting ? '주문 처리 중...' : `₩ ${total.toLocaleString()} 결제하기`}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

export default Checkout;
