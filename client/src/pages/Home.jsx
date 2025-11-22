import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';
import { apiRequest, API_BASE_URL } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PRODUCT_CATEGORIES, getCategoryLabel } from '../lib/productCategories.js';

const CATEGORY_FILTERS = [{ value: 'all', label: '전체' }, ...PRODUCT_CATEGORIES];

function Home() {
  const { user, loading, setCartCount } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingAccountData, setIsLoadingAccountData] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const query = activeCategory === 'all' ? '' : `?category=${activeCategory}`;
      const data = await apiRequest(`/products${query}`);
      setProducts(data);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [activeCategory]);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart([]);
      setCartCount(0);
      return;
    }

    try {
      const data = await apiRequest('/cart');
      const items = data.items ?? [];
      setCart(items);
      const count = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
      setCartCount(count);
    } catch (error) {
      setCart([]);
      setCartCount(0);
      throw error;
    }
  }, [user, setCartCount]);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    const data = await apiRequest('/orders');
    setOrders(data);
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setStatusMessage('');
  }, [activeCategory]);

  useEffect(() => {
    const loadAccountData = async () => {
      if (loading) return;

      if (!user) {
        setCart([]);
        setOrders([]);
        setCartCount(0);
        return;
      }

      setIsLoadingAccountData(true);
      try {
        await Promise.all([fetchCart(), fetchOrders()]);
      } catch (error) {
        setStatusMessage(error.message);
      } finally {
        setIsLoadingAccountData(false);
      }
    };

    loadAccountData();
  }, [loading, user, fetchCart, fetchOrders, setCartCount]);

  useEffect(() => {
    if (location.state?.focus === 'cart') {
      const section = document.getElementById('cart-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
      navigate('.', { replace: true, state: {} });
    }
  }, [location, navigate]);

  const requireLogin = () => {
    if (!user) {
      setStatusMessage('로그인 후 이용해주세요.');
      return true;
    }
    return false;
  };

  const handleAddToCart = async (productId) => {
    if (requireLogin()) return;

    try {
      await apiRequest('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      setStatusMessage('장바구니에 추가되었습니다.');
      await fetchCart();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleRemoveFromCart = async (itemId) => {
    if (requireLogin()) return;

    try {
      await apiRequest(`/cart/${itemId}`, { method: 'DELETE' });
      setStatusMessage('장바구니에서 제거했습니다.');
      await fetchCart();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (requireLogin()) return;

    try {
      await apiRequest(`/orders/${orderId}`, { method: 'DELETE' });
      setStatusMessage('주문이 취소되었습니다.');
      await fetchOrders();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const activeCategoryLabel = useMemo(
    () => (activeCategory === 'all' ? '전체' : getCategoryLabel(activeCategory)),
    [activeCategory],
  );

  return (
    <div className="App">
      <header>
        <h1>종이책 연구소</h1>
        <p>종이책 연구소의 온라인 쇼핑몰입니다.</p>
      </header>

      {statusMessage && <div className="status">{statusMessage}</div>}

      <main>
        <section className="products">
          <div className="section-header">
            <h2>상품 목록</h2>
            <button type="button" onClick={fetchProducts} disabled={isLoadingProducts}>
              새로고침
            </button>
          </div>
          <div className="category-filters">
            {CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`category-pill ${activeCategory === filter.value ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(filter.value)}
                disabled={isLoadingProducts && activeCategory === filter.value}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {isLoadingProducts ? (
            <p>상품을 불러오는 중입니다...</p>
          ) : products.length ? (
            <div className="product-grid">
              {products.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="product-thumb">
                    {product.primaryImage?.url ? (
                      <img src={product.primaryImage.url} alt={product.name} />
                    ) : (
                      <span className="placeholder">이미지 없음</span>
                    )}
                  </div>
                  <div className="product-body">
                    <h3>{product.name}</h3>
                    <div className="product-meta">
                      <span className="badge badge--muted">SKU {product.sku}</span>
                      <span className="badge">{getCategoryLabel(product.category)}</span>
                      <span className="badge badge--muted">
                        배송비 ₩ {(product.shippingFee ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="price">₩ {product.price?.toLocaleString?.() ?? product.price}</p>
                    <p className="description">{product.description}</p>
                  </div>

                  <div className="product-actions">
                    <button type="button" onClick={() => navigate(`/products/${product.id}`)}>
                      상세 보기
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={!user}
                    >
                      장바구니
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted-text">
              {activeCategoryLabel} 카테고리에 등록된 상품이 없습니다.
            </p>
          )}
        </section>

        <section className="cart" id="cart-section">
          <div className="section-header">
            <h2>장바구니</h2>
            <button type="button" onClick={fetchCart} disabled={!user || isLoadingAccountData}>
              새로고침
            </button>
          </div>

          {!user ? (
            <p>장바구니를 보려면 로그인해주세요.</p>
          ) : isLoadingAccountData ? (
            <p>장바구니를 불러오는 중입니다...</p>
          ) : (
            <>
              <ul>
                {cart.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span> 수량 {item.quantity}</span>
                      <span> / ₩ {item.price?.toLocaleString?.() ?? item.price}</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveFromCart(item.id)}>
                      제거
                    </button>
                  </li>
                ))}
              </ul>

              <div className="cart-footer">
                <p>총 금액: ₩ {totalPrice.toLocaleString()}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (requireLogin()) return;
                    navigate('/checkout');
                  }}
                  disabled={!cart.length}
                >
                  주문하기
                </button>
              </div>
            </>
          )}
        </section>

        <section className="orders">
          <div className="section-header">
            <h2>주문 내역</h2>
            <button type="button" onClick={fetchOrders} disabled={!user || isLoadingAccountData}>
              새로고침
            </button>
          </div>

          {!user ? (
            <p>주문 내역을 확인하려면 로그인해주세요.</p>
          ) : isLoadingAccountData ? (
            <p>주문 내역을 불러오는 중입니다...</p>
          ) : orders.length ? (
            <ul>
              {orders.map((order) => (
                <li key={order.id}>
                  <div>
                    <strong>주문번호 {order.id}</strong>
                    <span> / 품목 {order.items?.length ?? 0}개</span>
                    <span> / 총액 ₩ {order.pricing?.total?.toLocaleString?.() ?? order.pricing?.total ?? order.total}</span>
                  </div>
                  <button type="button" onClick={() => handleCancelOrder(order.id)}>
                    주문 취소
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>등록된 주문이 없습니다.</p>
          )}
        </section>
      </main>

    </div>
  );
}

export default Home;
