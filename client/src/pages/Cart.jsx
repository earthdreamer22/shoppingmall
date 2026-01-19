import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { apiRequest } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';

function Cart() {
  const { user, loading, setCartCount } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart([]);
      setCartCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest('/cart');
      const items = data.items ?? [];
      setCart(items);
      const count = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
      setCartCount(count);
    } catch (error) {
      setCart([]);
      setCartCount(0);
      setStatusMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, setCartCount]);

  useEffect(() => {
    if (!loading) {
      fetchCart();
    }
  }, [loading, fetchCart]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) return;

    try {
      await apiRequest(`/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQuantity }),
      });
      await fetchCart();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleRemoveFromCart = async (itemId) => {
    try {
      await apiRequest(`/cart/${itemId}`, { method: 'DELETE' });
      setStatusMessage('장바구니에서 제거했습니다.');
      await fetchCart();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  if (loading) {
    return (
      <div className="App">
        <div className="page-status">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="App">
        <section className="empty-state">
          <h2>장바구니</h2>
          <p>장바구니를 보려면 로그인해주세요.</p>
          <button type="button" onClick={() => navigate('/login')}>
            로그인하기
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="App">
      <section className="cart-page">
        <div className="section-header">
          <h2>장바구니</h2>
          <button type="button" onClick={fetchCart} disabled={isLoading}>
            새로고침
          </button>
        </div>

        {statusMessage && <div className="status">{statusMessage}</div>}

        {isLoading ? (
          <p>장바구니를 불러오는 중입니다...</p>
        ) : cart.length === 0 ? (
          <div className="empty-cart">
            <p>장바구니가 비어있습니다.</p>
            <button type="button" onClick={() => navigate('/')}>
              쇼핑하러 가기
            </button>
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {cart.map((item) => (
                <li key={item.id} className="cart-item">
                  <div className="cart-item__info">
                    <strong>{item.name}</strong>
                    {item.selectedOptions?.length > 0 && (
                      <div className="cart-item__options">
                        {item.selectedOptions.map((opt, idx) => (
                          <span key={idx} className="cart-item__option">
                            {opt.name}: {opt.value}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="cart-item__quantity">
                      <span>수량:</span>
                      <div className="quantity-controls">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1 && val <= 999) {
                              handleUpdateQuantity(item.id, val);
                            }
                          }}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (isNaN(val) || val < 1) {
                              handleUpdateQuantity(item.id, 1);
                            } else if (val > 999) {
                              handleUpdateQuantity(item.id, 999);
                            }
                          }}
                          className="quantity-input"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= 999}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <span className="cart-item__price">
                      ₩ {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="cart-item__remove"
                    onClick={() => handleRemoveFromCart(item.id)}
                  >
                    제거
                  </button>
                </li>
              ))}
            </ul>

            <div className="cart-summary">
              <div className="cart-summary__total">
                <span>총 금액</span>
                <strong>₩ {totalPrice.toLocaleString()}</strong>
              </div>
              <button
                type="button"
                className="cart-summary__checkout"
                onClick={() => navigate('/checkout')}
              >
                주문하기
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Cart;
