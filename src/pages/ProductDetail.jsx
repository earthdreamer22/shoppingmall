import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import '../App.css';
import { apiRequest } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getCategoryLabel } from '../lib/productCategories.js';

function formatPrice(value) {
  if (value == null) return '₩ -';
  return `₩ ${Number(value).toLocaleString()}`;
}

function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setCartCount } = useAuth();

  const [product, setProduct] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setStatus('');
      try {
        const data = await apiRequest(`/products/${productId}`);
        setProduct(data);
        const primaryIndex = data.images?.findIndex((image) => image.isPrimary) ?? -1;
        setActiveIndex(primaryIndex >= 0 ? primaryIndex : 0);

        try {
          const query = data.category ? `?category=${data.category}` : '';
          const list = await apiRequest(`/products${query}`);
          const candidates = list.filter((item) => item.id !== data.id).slice(0, 8);
          setRelated(candidates);
        } catch (error) {
          console.error('Failed to load related products', error);
        }
      } catch (error) {
        setStatus(error.message ?? '상품 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const images = useMemo(() => product?.images ?? [], [product]);
  const activeImage = images[activeIndex] ?? null;

  const recombinedDescription = useMemo(() => {
    if (!product?.description) return [];
    return product.description.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  }, [product]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!user) {
      setStatus('로그인 후 장바구니를 이용할 수 있습니다.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    setWorking(true);
    setStatus('');
    try {
      await apiRequest('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      setStatus('장바구니에 상품이 담겼습니다.');

      try {
        const data = await apiRequest('/cart');
        const totalCount = (data.items ?? []).reduce(
          (sum, item) => sum + (item.quantity ?? 0),
          0,
        );
        setCartCount(totalCount);
      } catch (error) {
        console.error('Failed to refresh cart count', error);
      }
    } catch (error) {
      setStatus(error.message ?? '장바구니에 담는 중 문제가 발생했습니다.');
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <div className="App detail-page">
        <div className="detail-status">상품 정보를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="App detail-page">
        <div className="detail-status error">{status || '상품을 찾을 수 없습니다.'}</div>
        <button type="button" className="detail-secondary" onClick={() => navigate('/')}>홈으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className="App detail-page">
      <nav className="detail-breadcrumb">
        <button type="button" onClick={() => navigate(-1)}>
          ← 뒤로가기
        </button>
        <span>/</span>
        <button type="button" onClick={() => navigate('/')}>홈</button>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <section className="detail-hero">
        <div className="detail-gallery">
          {activeImage ? (
            <img src={activeImage.url} alt={`${product.name} 대표 이미지`} className="detail-hero__image" />
          ) : (
            <div className="detail-hero__placeholder">이미지를 준비 중입니다.</div>
          )}

          {images.length > 1 && (
            <div className="detail-thumbnails">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={image.publicId}
                  className={`detail-thumbnail ${index === activeIndex ? 'is-active' : ''}`}
                  onClick={() => setActiveIndex(index)}
                >
                  <img src={image.url} alt={`${product.name} 썸네일 ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="detail-info">
          <h1>{product.name}</h1>
          <p className="detail-sku">SKU {product.sku}</p>
          <div className="detail-price">{formatPrice(product.price)}</div>
          <div className="detail-tags">
            <span className="badge">{getCategoryLabel(product.category)}</span>
            {product.images?.length ? (
              <span className="badge badge--muted">이미지 {product.images.length}장</span>
            ) : null}
            <span className="badge badge--muted">배송비 ₩ {(product.shippingFee ?? 0).toLocaleString()}</span>
          </div>

          {recombinedDescription.length ? (
            <div className="detail-description">
              {recombinedDescription.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : (
            <p className="detail-description muted-text">상품 설명이 준비 중입니다.</p>
          )}

          {status && <div className={`status ${status.startsWith('장바구니') ? '' : 'error'}`}>{status}</div>}

          <div className="detail-actions">
            <button type="button" className="detail-primary" onClick={handleAddToCart} disabled={working}>
              {working ? '처리 중...' : '장바구니에 담기'}
            </button>
            <button type="button" className="detail-secondary" onClick={() => navigate('/')}>상품 목록으로</button>
          </div>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="detail-related">
          <div className="section-header">
            <h2>이 상품은 어떠세요?</h2>
            <button type="button" onClick={() => navigate('/')}>더 보기</button>
          </div>

          <div className="related-grid">
            {related.map((item) => (
              <article key={item.id} className="related-card" onClick={() => navigate(`/products/${item.id}`)}>
                <div className="related-thumb">
                  {item.primaryImage?.url ? (
                    <img src={item.primaryImage.url} alt={item.name} />
                  ) : (
                    <span className="placeholder">이미지 없음</span>
                  )}
                </div>
                <div className="related-body">
                  <h3>{item.name}</h3>
                  <small className="muted-text">{getCategoryLabel(item.category)}</small>
                  <p className="related-price">{formatPrice(item.price)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetail;
