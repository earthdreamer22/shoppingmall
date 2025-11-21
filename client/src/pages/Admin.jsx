import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PRODUCT_CATEGORIES, getCategoryLabel } from '../lib/productCategories.js';
const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: '결제 대기' },
  { value: 'paid', label: '결제 완료' },
  { value: 'shipped', label: '배송 중' },
  { value: 'delivered', label: '배송 완료' },
  { value: 'cancelled', label: '취소' },
];

const DEFAULT_INVITE_HOURS = Number(import.meta.env.VITE_ADMIN_INVITE_HOURS ?? 12) || 12;

function formatCurrency(amount) {
  if (amount == null) return '-';
  return `₩ ${Number(amount).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return value;
  }
}

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '';
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '';

function createEmptyProduct() {
  return {
    sku: '',
    name: '',
    price: '',
    category: PRODUCT_CATEGORIES[0].value,
    shippingFee: 3000,
    description: '',
    images: [],
  };
}

function Admin() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(createEmptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [removedImages, setRemovedImages] = useState([]);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetMessage, setWidgetMessage] = useState('');

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [orderNotice, setOrderNotice] = useState('');
  const [orderNoticeType, setOrderNoticeType] = useState('info');
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteNotice, setInviteNotice] = useState('');
  const [inviteNoticeType, setInviteNoticeType] = useState('info');
  const [inviteForm, setInviteForm] = useState(() => ({
    email: '',
    expiresInHours: DEFAULT_INVITE_HOURS,
  }));
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const widgetRef = useRef(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [loading, user, navigate]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await apiRequest('/admin/products');
      setProducts(data);
    } catch (error) {
      setStatusType('error');
      setStatus(error.message);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError('');
    setOrderNotice('');
    try {
      const data = await apiRequest('/admin/orders');
      setOrders(data);
    } catch (error) {
      setOrdersError(error.message ?? '주문 목록을 불러오지 못했습니다.');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchInvites = useCallback(async () => {
    setInvitesLoading(true);
    setInviteError('');
    try {
      const data = await apiRequest('/admin/invites');
      setInvites(data);
    } catch (error) {
      setInviteError(error.message ?? '초대 목록을 불러오지 못했습니다.');
    } finally {
      setInvitesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProducts();
      fetchOrders();
      fetchInvites();
    }
  }, [user, fetchProducts, fetchOrders, fetchInvites]);

  const handleCreateInvite = useCallback(
    async (event) => {
      event.preventDefault();
      setInviteNotice('');
      setInviteNoticeType('info');
      setIsCreatingInvite(true);

      try {
        const payload = {};
        const trimmedEmail = inviteForm.email.trim();
        if (trimmedEmail) {
          payload.email = trimmedEmail.toLowerCase();
        }
        const hours = Number(inviteForm.expiresInHours);
        if (Number.isFinite(hours) && hours > 0) {
          payload.expiresInHours = hours;
        }

        await apiRequest('/admin/invites', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setInviteNoticeType('success');
        setInviteNotice('새 관리자 초대 코드가 발급되었습니다.');
        setInviteForm({ email: '', expiresInHours: DEFAULT_INVITE_HOURS });
        await fetchInvites();
      } catch (error) {
        setInviteNoticeType('error');
        setInviteNotice(error.message ?? '초대 코드 발급에 실패했습니다.');
      } finally {
        setIsCreatingInvite(false);
      }
    },
    [inviteForm, fetchInvites],
  );

  const handleCopyInviteCode = useCallback(async (code) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        throw new Error('clipboard api unavailable');
      }
      setInviteNoticeType('success');
      setInviteNotice('초대 코드가 클립보드에 복사되었습니다.');
    } catch (_error) {
      window.prompt('초대 코드를 복사해주세요.', code);
      setInviteNoticeType('info');
      setInviteNotice('브라우저에서 복사 창을 열었습니다.');
    }
  }, []);

  const handleRevokeInvite = useCallback(
    async (inviteId) => {
      if (!window.confirm('해당 초대 코드를 즉시 만료시키겠습니까?')) return;
      try {
        await apiRequest(`/admin/invites/${inviteId}`, {
          method: 'DELETE',
        });
        setInviteNoticeType('success');
        setInviteNotice('초대 코드가 만료 처리되었습니다.');
        await fetchInvites();
      } catch (error) {
        setInviteNoticeType('error');
        setInviteNotice(error.message ?? '초대 코드 만료 처리에 실패했습니다.');
      }
    },
    [fetchInvites],
  );

  const handleWidgetResult = useCallback((error, result) => {
    if (error) {
      console.error('[cloudinary] widget error', error);
      setStatusType('error');
      setStatus(error.message ?? '이미지 업로드 중 오류가 발생했습니다.');
      return;
    }

    if (!result || result.event !== 'success') return;

    const info = result.info;
    setForm((prev) => {
      const exists = prev.images.some((image) => image.publicId === info.public_id);
      if (exists) {
        return prev;
      }

      const hasPrimary = prev.images.some((image) => image.isPrimary);
      const nextImages = [
        ...prev.images,
        {
          publicId: info.public_id,
          url: info.secure_url ?? info.url,
          isPrimary: hasPrimary ? false : true,
          deleteToken: info.delete_token ?? null,
        },
      ];

      return { ...prev, images: nextImages };
    });
  }, []);

  useEffect(() => {
    if (widgetRef.current || widgetReady) return;

    if (!cloudName || !uploadPreset) {
      setWidgetMessage('Cloudinary 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      return;
    }

    if (window.cloudinary?.createUploadWidget) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          multiple: true,
          maxFiles: 10,
          resourceType: 'image',
          folder: 'shoppingmall/products',
          showCompletedButton: true,
          showUploadMoreButton: true,
          styles: {
            palette: {
              window: '#1e293b',
              windowBorder: '#334155',
              tabIcon: '#38bdf8',
              menuIcons: '#94a3b8',
              textDark: '#0f172a',
              textLight: '#e2e8f0',
              link: '#38bdf8',
              action: '#38bdf8',
              inactiveTabIcon: '#64748b',
              error: '#f87171',
              inProgress: '#38bdf8',
              complete: '#34d399',
            },
          },
        },
        handleWidgetResult,
      );
      setWidgetReady(true);
      setWidgetMessage('');
    } else {
      setWidgetMessage('Cloudinary 위젯을 불러오는 중입니다...');
      const timer = setTimeout(() => {
        if (!window.cloudinary?.createUploadWidget) {
          setWidgetMessage('Cloudinary 위젯을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [handleWidgetResult, widgetReady]);

  const deleteImageByToken = useCallback(async (token) => {
    if (!token || !cloudName) return;
    try {
      const formData = new FormData();
      formData.append('token', token);
      await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/delete_by_token`, {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('[cloudinary] delete_by_token 실패', error);
    }
  }, []);

  const resetForm = useCallback(() => {
    setForm(createEmptyProduct());
    setEditingProductId(null);
    setRemovedImages([]);
  }, []);

  const openUploadWidget = () => {
    if (!widgetRef.current) {
      setStatusType('error');
      setStatus(widgetMessage || '이미지 업로드 위젯을 사용할 수 없습니다.');
      return;
    }
    widgetRef.current.open();
  };

  const handleRemoveImage = async (publicId) => {
    const image = form.images.find((item) => item.publicId === publicId);
    if (!image) return;

    if (image.deleteToken) {
      await deleteImageByToken(image.deleteToken);
    } else if (editingProductId) {
      setRemovedImages((prev) => (prev.includes(publicId) ? prev : [...prev, publicId]));
    }

    setForm((prev) => {
      const remaining = prev.images
        .filter((item) => item.publicId !== publicId)
        .map((item) => ({ ...item }));

      if (remaining.length && !remaining.some((item) => item.isPrimary)) {
        remaining[0].isPrimary = true;
      }

      return { ...prev, images: remaining };
    });
  };

  const handleSetPrimaryImage = (publicId) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((image) => ({
        ...image,
        isPrimary: image.publicId === publicId,
      })),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');
    setStatusType('info');
    setIsSubmitting(true);

    try {
      if (!form.sku.trim()) {
        throw new Error('상품 ID(SKU)를 입력해주세요.');
      }

      if (!form.name.trim()) {
        throw new Error('상품 이름을 입력해주세요.');
      }

      if (!form.images.length) {
        throw new Error('대표 이미지를 포함한 상품 이미지를 최소 한 장 이상 등록해주세요.');
      }

      const primaryImage = form.images.find((image) => image.isPrimary);
      if (!primaryImage) {
        throw new Error('대표 이미지를 선택해주세요.');
      }

      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        price: Number(form.price) || 0,
        category: form.category,
        shippingFee: Number(form.shippingFee) || 0,
        description: form.description,
        images: form.images.map(({ publicId, url, isPrimary }) => ({ publicId, url, isPrimary })),
        primaryImagePublicId: primaryImage.publicId,
      };

      if (editingProductId) {
        payload.removedImagePublicIds = removedImages;
        await apiRequest(`/admin/products/${editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setStatusType('success');
        setStatus('상품이 수정되었습니다.');
      } else {
        await apiRequest('/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setStatusType('success');
        setStatus('상품이 등록되었습니다.');
      }

      resetForm();
      await fetchProducts();
    } catch (error) {
      setStatusType('error');
      setStatus(error.message ?? '상품 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProductId(product.id);
    setRemovedImages([]);
    setForm({
      sku: product.sku,
      name: product.name,
      price: product.price != null ? String(product.price) : '',
      category: product.category ?? PRODUCT_CATEGORIES[0].value,
      shippingFee: product.shippingFee != null ? String(product.shippingFee) : '3000',
      description: product.description ?? '',
      images: (product.images ?? []).map((image) => ({
        publicId: image.publicId,
        url: image.url,
        isPrimary: Boolean(image.isPrimary),
      })),
    });
    setStatus('');
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('해당 상품을 삭제하시겠습니까?')) return;

    try {
      await apiRequest(`/admin/products/${productId}`, { method: 'DELETE' });
      setStatusType('success');
      setStatus('상품이 삭제되었습니다.');
      if (editingProductId === productId) {
        resetForm();
      }
      await fetchProducts();
    } catch (error) {
      setStatusType('error');
      setStatus(error.message);
    }
  };

  const pageTitle = useMemo(
    () => (editingProductId ? '상품 수정' : '상품 등록'),
    [editingProductId],
  );

  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    try {
      const updated = await apiRequest(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)));
      setOrderNoticeType('success');
      setOrderNotice('주문 상태가 업데이트되었습니다.');
    } catch (error) {
      setOrderNoticeType('error');
      setOrderNotice(error.message ?? '주문 상태를 변경하지 못했습니다.');
    }
  };

  const handleAdminCancelOrder = async (orderId) => {
    if (!window.confirm('주문을 취소하시겠습니까?')) return;

    try {
      await apiRequest(`/admin/orders/${orderId}`, { method: 'DELETE' });
      await fetchOrders();
      setOrderNoticeType('success');
      setOrderNotice('주문이 취소되었습니다.');
    } catch (error) {
      setOrderNoticeType('error');
      setOrderNotice(error.message ?? '주문을 취소하지 못했습니다.');
    }
  };

  if (loading) {
    return <div className="App">사용자 정보를 불러오는 중입니다...</div>;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="App">
      <header>
        <h1>관리자 대시보드</h1>
        <p>상품 정보를 생성, 수정, 삭제하고 이미지 관리까지 수행할 수 있습니다.</p>
      </header>

      {status && <div className={`status ${statusType === 'error' ? 'error' : ''}`}>{status}</div>}

      <main>
        <section className="product-form">
          <h2>{pageTitle}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-grid">
              <label>
                상품 ID (SKU)
                <input
                  required
                  name="sku"
                  value={form.sku}
                  onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
                  placeholder="예: TOP-001"
                />
              </label>
              <label>
                상품 이름
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>
              <label>
                상품 가격 (원)
                <input
                  required
                  type="number"
                  min="0"
                  step="1000"
                  name="price"
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                />
              </label>
              <label>
                상품 카테고리
                <select
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="inline-select"
                  required
                >
                  {PRODUCT_CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small className="muted-text">
                  {
                    PRODUCT_CATEGORIES.find((option) => option.value === form.category)?.description ??
                    '카테고리를 선택해주세요.'
                  }
                </small>
              </label>
              <label>
                배송비 (원)
                <input
                  required
                  type="number"
                  min="0"
                  step="500"
                  value={form.shippingFee}
                  onChange={(event) => setForm((prev) => ({ ...prev, shippingFee: event.target.value }))}
                  placeholder="예: 3000"
                />
                <small className="muted-text">상품별 기본 배송비입니다. 500원 단위로 입력하세요.</small>
              </label>
              <label className="full-width">
                상품 설명
                <textarea
                  name="description"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="상품 상세 설명을 입력해주세요."
                />
              </label>
            </div>

            <div className="image-upload">
              <div className="image-upload__header">
                <h3>상품 이미지</h3>
                <button type="button" onClick={openUploadWidget} disabled={!widgetReady}>
                  이미지 업로드
                </button>
              </div>
              {widgetMessage && <p className="muted-text">{widgetMessage}</p>}

              <div className="image-list">
                {form.images.map((image) => (
                  <div
                    key={image.publicId}
                    className={`image-card ${image.isPrimary ? 'image-card--primary' : ''}`}
                  >
                    <img src={image.url} alt="상품 이미지" />
                    {image.isPrimary && <span className="badge badge--primary">대표</span>}
                    <div className="image-card__actions">
                      {!image.isPrimary && (
                        <button type="button" onClick={() => handleSetPrimaryImage(image.publicId)}>
                          대표로 지정
                        </button>
                      )}
                      <button type="button" className="danger" onClick={() => handleRemoveImage(image.publicId)}>
                        이미지 제거
                      </button>
                    </div>
                  </div>
                ))}

                {!form.images.length && (
                  <p className="muted-text">업로드된 이미지가 없습니다. 대표 이미지를 포함해 최소 한 장 이상 등록해주세요.</p>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={isSubmitting || !form.images.length}>
                {isSubmitting ? '저장 중...' : editingProductId ? '상품 수정' : '상품 등록'}
              </button>
              {editingProductId && (
                <button type="button" onClick={resetForm}>
                  새 상품 등록
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="products">
          <div className="section-header">
            <h2>상품 목록</h2>
            <button type="button" onClick={fetchProducts}>
              새로고침
            </button>
          </div>

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
                    <span className="badge badge--muted">이미지 {product.images?.length ?? 0}장</span>
                    <span className="badge badge--muted">배송비 ₩ {(product.shippingFee ?? 0).toLocaleString()}</span>
                  </div>
                  <p className="price">₩ {product.price?.toLocaleString?.() ?? product.price}</p>
                  <p className="description">{product.description}</p>
                </div>

                <div className="product-actions">
                  <button type="button" onClick={() => handleEdit(product)}>
                    수정
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(product.id)}>
                    삭제
                  </button>
                </div>
              </article>
            ))}

            {!products.length && <p>등록된 상품이 없습니다.</p>}
          </div>
        </section>

        <section className="admin-orders">
          <div className="section-header">
            <h2>주문 관리</h2>
            <button type="button" onClick={fetchOrders}>
              새로고침
            </button>
          </div>

          {orderNotice && (
            <div className={`status ${orderNoticeType === 'error' ? 'error' : ''}`}>{orderNotice}</div>
          )}

          {ordersLoading ? (
            <p>주문 목록을 불러오는 중입니다...</p>
          ) : ordersError ? (
            <p className="status error">{ordersError}</p>
          ) : orders.length ? (
            <div className="admin-order-table-wrapper">
              <table className="admin-order-table">
                <thead>
                  <tr>
                    <th>주문번호</th>
                    <th>주문일</th>
                    <th>고객</th>
                    <th>결제 금액</th>
                    <th>결제 상태</th>
                    <th>배송 상태</th>
                    <th>조치</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        {order.customer ? (
                          <div className="order-customer">
                            <strong>{order.customer.name}</strong>
                            <span>{order.customer.email}</span>
                            <span>{order.customer.phone}</span>
                          </div>
                        ) : (
                          <span className="muted-text">알 수 없음</span>
                        )}
                      </td>
                      <td>{formatCurrency(order.pricing?.total)}</td>
                      <td>
                        <div className="order-payment">
                          <span className={`order-badge status-${order.payment?.status ?? 'unknown'}`}>
                            {order.payment?.status ?? 'unknown'}
                          </span>
                          <small>{order.payment?.method}</small>
                        </div>
                      </td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(event) => handleUpdateOrderStatus(order.id, event.target.value)}
                        >
                          {ORDER_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="order-shipping">
                          <small>송장: {order.shipping?.trackingNumber || '-'}</small>
                          <small>배송 시작: {formatDate(order.shipping?.shippedAt)}</small>
                          <small>배송 완료: {formatDate(order.shipping?.deliveredAt)}</small>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleAdminCancelOrder(order.id)}
                          disabled={order.status === 'cancelled'}
                        >
                          주문 취소
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>아직 등록된 주문이 없습니다.</p>
          )}
        </section>

        <section className="admin-invites">
          <div className="section-header">
            <h2>관리자 초대 코드</h2>
            <button type="button" onClick={fetchInvites}>
              새로고침
            </button>
          </div>

          <form className="admin-form invite-form" onSubmit={handleCreateInvite}>
            <div className="form-grid">
              <label>
                초대 이메일 (선택)
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) =>
                    setInviteForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="지정된 이메일만 허용하려면 입력"
                />
              </label>
              <label>
                만료 시간 (시간)
                <input
                  type="number"
                  min="1"
                  value={inviteForm.expiresInHours}
                  onChange={(event) =>
                    setInviteForm((prev) => ({ ...prev, expiresInHours: event.target.value }))
                  }
                  required
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={isCreatingInvite}>
                {isCreatingInvite ? '발급 중...' : '초대 코드 발급'}
              </button>
            </div>
          </form>

          {inviteNotice && (
            <div className={`status ${inviteNoticeType === 'error' ? 'error' : ''}`}>{inviteNotice}</div>
          )}
          {inviteError && <p className="status error">{inviteError}</p>}

          {invitesLoading ? (
            <p>초대 코드를 불러오는 중입니다...</p>
          ) : invites.length ? (
            <div className="admin-order-table-wrapper">
              <table className="admin-order-table">
                <thead>
                  <tr>
                    <th>코드</th>
                    <th>대상 이메일</th>
                    <th>만료</th>
                    <th>상태</th>
                    <th>조치</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((invite) => {
                    const expiresAt = invite.expiresAt ? new Date(invite.expiresAt) : null;
                    const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;
                    const isUsed = Boolean(invite.usedAt);
                    return (
                      <tr key={invite.id}>
                        <td className="code-cell">
                          <code>{invite.code}</code>
                        </td>
                        <td>{invite.email || <span className="muted-text">제한 없음</span>}</td>
                        <td>{formatDate(invite.expiresAt)}</td>
                        <td>
                          {isUsed ? (
                            <span className="badge badge--muted">사용됨</span>
                          ) : isExpired ? (
                            <span className="badge badge--muted">만료</span>
                          ) : (
                            <span className="badge">대기</span>
                          )}
                        </td>
                        <td className="invite-actions">
                          <button
                            type="button"
                            onClick={() => handleCopyInviteCode(invite.code)}
                            disabled={isUsed || isExpired}
                          >
                            코드 복사
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleRevokeInvite(invite.id)}
                            disabled={isUsed}
                          >
                            즉시 만료
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>발급된 초대 코드가 없습니다.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Admin;
