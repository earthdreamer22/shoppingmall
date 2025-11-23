import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { apiRequest } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PRODUCT_CATEGORIES, getCategoryLabel } from '../lib/productCategories.js';

const CATEGORY_FILTERS = [{ value: 'all', label: '전체' }, ...PRODUCT_CATEGORIES];

function Home() {
  const { user, setCartCount } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setStatusMessage('');
  }, [activeCategory]);

  const handleAddToCart = async (productId) => {
    if (!user) {
      setStatusMessage('로그인 후 이용해주세요.');
      return;
    }

    try {
      await apiRequest('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      setStatusMessage('장바구니에 추가되었습니다.');

      // Update cart count
      const cartData = await apiRequest('/cart');
      const count = (cartData.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0);
      setCartCount(count);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

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
      </main>
    </div>
  );
}

export default Home;
