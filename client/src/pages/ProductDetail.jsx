import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import '../App.css';
import { apiRequest } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getCategoryLabel } from '../lib/productCategories.js';

function formatPrice(value) {
  if (value == null) return '-';
  return `${Number(value).toLocaleString()}원`;
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
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);

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

    // 필수 옵션 검증
    const requiredOptions = product.options?.filter((opt) => opt.required) ?? [];
    for (const opt of requiredOptions) {
      if (!selectedOptions[opt.name]) {
        setStatus(`${opt.name}을(를) 선택해주세요.`);
        return;
      }
    }

    setWorking(true);
    setStatus('');
    try {
      const optionsArray = Object.entries(selectedOptions).map(([name, value]) => ({ name, value }));
      await apiRequest('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, quantity, selectedOptions: optionsArray }),
      });
      setStatus(`장바구니에 상품이 ${quantity}개 담겼습니다.`);

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

  const handlePurchase = async () => {
    if (!product) return;

    if (!user) {
      setStatus('로그인 후 구매하실 수 있습니다.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    // 필수 옵션 검증
    const requiredOptions = product.options?.filter((opt) => opt.required) ?? [];
    for (const opt of requiredOptions) {
      if (!selectedOptions[opt.name]) {
        setStatus(`${opt.name}을(를) 선택해주세요.`);
        return;
      }
    }

    setWorking(true);
    setStatus('');
    try {
      const optionsArray = Object.entries(selectedOptions).map(([name, value]) => ({ name, value }));
      await apiRequest('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, quantity, selectedOptions: optionsArray }),
      });

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

      // 장바구니 페이지로 이동
      navigate('/cart');
    } catch (error) {
      setStatus(error.message ?? '구매 처리 중 문제가 발생했습니다.');
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

  const handleInquiry = () => {
    // 카카오톡 채널 또는 문의 페이지로 이동
    window.open('http://pf.kakao.com/_cqxltxj/friend', '_blank');
  };

  return (
    <div className="App detail-page">
      <button type="button" className="floating-inquiry" onClick={handleInquiry}>
        <span className="inquiry-icon">💬</span>
        <span>문의</span>
      </button>
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
          <div className="detail-price">{formatPrice(product.price)}</div>
          <div className="detail-tags">
            <span className="badge">{getCategoryLabel(product.category)}</span>
            {product.images?.length ? (
              <span className="badge badge--muted">이미지 {product.images.length}장</span>
            ) : null}
            <span className="badge badge--muted">배송비 {(product.shippingFee ?? 0).toLocaleString()}원</span>
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

          {product.options?.length > 0 && (
            <div className="detail-options">
              {product.options.map((option) => (
                <div key={option.name} className="detail-option">
                  <label className="detail-option-label">
                    {option.name} {option.required && <span className="required">*</span>}
                  </label>
                  <select
                    value={selectedOptions[option.name] || ''}
                    onChange={(e) => setSelectedOptions((prev) => ({
                      ...prev,
                      [option.name]: e.target.value
                    }))}
                    className={option.required && !selectedOptions[option.name] ? 'required-select' : ''}
                  >
                    <option value="">{option.name} 선택{option.required ? ' (필수)' : ''}</option>
                    {option.values.map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="detail-quantity">
            <label className="detail-option-label">수량</label>
            <div className="quantity-controls">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 999) {
                    setQuantity(val);
                  }
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val < 1) {
                    setQuantity(1);
                  } else if (val > 999) {
                    setQuantity(999);
                  }
                }}
                className="quantity-input"
              />
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.min(999, prev + 1))}
                disabled={quantity >= 999}
              >
                +
              </button>
            </div>
            {quantity > 1 && (
              <div className="detail-total-price">
                합계: {formatPrice(product.price * quantity)}
              </div>
            )}
          </div>

          {status && <div className={`status ${status.startsWith('장바구니') ? '' : 'error'}`}>{status}</div>}

          <div className="detail-actions">
            <button type="button" className="detail-buy" onClick={handlePurchase} disabled={working}>
              {working ? '처리 중...' : '구매하기'}
            </button>
            <button type="button" className="detail-cart" onClick={handleAddToCart} disabled={working}>
              {working ? '처리 중...' : '장바구니'}
            </button>
          </div>
        </aside>
      </section>

      {product.detailBlocks?.length > 0 && (
        <section className="detail-content">
          {product.detailBlocks.map((block, index) => (
            <div key={index} className={`content-block content-block--${block.type}`}>
              {block.type === 'text' && (
                <div className="content-text">
                  {block.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
              {block.type === 'image' && block.url && (
                <div className="content-image">
                  <img src={block.url} alt="상세 이미지" />
                </div>
              )}
              {block.type === 'notice' && (
                <div className="content-notice">
                  <h4>주의사항</h4>
                  {block.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

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
