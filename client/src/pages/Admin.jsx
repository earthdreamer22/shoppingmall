import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PRODUCT_CATEGORIES, getCategoryLabel } from '../lib/productCategories.js';
import OrdersSection from '../components/admin/OrdersSection.jsx';
import InvitesSection from '../components/admin/InvitesSection.jsx';
import ScheduleSection from '../components/admin/ScheduleSection.jsx';
import ProductListSection from '../components/admin/ProductListSection.jsx';
import AdminFormNotice from '../components/admin/AdminFormNotice.jsx';
const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: '결제 대기' },
  { value: 'paid', label: '결제 완료' },
  { value: 'shipped', label: '배송 중' },
  { value: 'delivered', label: '배송 완료' },
  { value: 'cancelled', label: '취소' },
];

const SCHEDULE_STATUS_OPTIONS = [
  { value: 'unavailable', label: '수업 불가', color: '#ef4444' },
];

const DEFAULT_INVITE_HOURS = Number(import.meta.env.VITE_ADMIN_INVITE_HOURS ?? 12) || 12;

function formatCurrency(amount) {
  if (amount == null) return '-';
  return `\ ${Number(amount).toLocaleString()}`;
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

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: '파일이 선택되지 않았습니다.' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.'
    };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `파일 크기는 ${(MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0)}MB 이하여야 합니다.`
    };
  }

  return { valid: true };
}

function createEmptyProduct() {
  return {
    sku: '',
    name: '',
    price: '',
    category: PRODUCT_CATEGORIES[0].value,
    shippingFee: 3000,
    description: '',
    detailBlocks: [],
    options: [],
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

  // Schedule states
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState('');
  const [scheduleNoticeType, setScheduleNoticeType] = useState('info');
  const [selectedDay, setSelectedDay] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ status: 'unavailable', note: '' });

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

  const fetchSchedules = useCallback(async () => {
    setSchedulesLoading(true);
    try {
      const year = scheduleDate.getFullYear();
      const month = scheduleDate.getMonth() + 1;
      const data = await apiRequest(`/schedules?year=${year}&month=${month}`);
      setSchedules(data);
    } catch (error) {
      setScheduleNoticeType('error');
      setScheduleNotice(error.message ?? '일정을 불러오지 못했습니다.');
    } finally {
      setSchedulesLoading(false);
    }
  }, [scheduleDate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProducts();
      fetchOrders();
      fetchInvites();
    }
  }, [user, fetchProducts, fetchOrders, fetchInvites]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSchedules();
    }
  }, [user, fetchSchedules]);

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
          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
          maxFileSize: MAX_IMAGE_SIZE,
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
        detailBlocks: form.detailBlocks,
        options: form.options,
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
      detailBlocks: product.detailBlocks ?? [],
      options: product.options ?? [],
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

  const handleUpdateOrderStatus = async (orderId, nextStatus, shippingData = {}) => {
    try {
      const payload = { status: nextStatus };
      if (Object.keys(shippingData).length > 0) {
        payload.shipping = shippingData;
      }

      const updated = await apiRequest(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)));
      setOrderNoticeType('success');
      setOrderNotice('주문 상태가 업데이트되었습니다.');
    } catch (error) {
      setOrderNoticeType('error');
      setOrderNotice(error.message ?? '주문 상태를 변경하지 못했습니다.');
    }
  };

  const handleUpdateTracking = async (orderId, carrier, trackingNumber) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      await handleUpdateOrderStatus(orderId, order.status, {
        carrier,
        trackingNumber,
      });
    } catch (error) {
      setOrderNoticeType('error');
      setOrderNotice(error.message ?? '송장 정보 업데이트에 실패했습니다.');
    }
  };

  const handleAdminCancelOrder = async (orderId) => {
    const reason = window.prompt('취소 사유를 입력해주세요 (선택사항):');
    if (reason === null) return; // 사용자가 취소를 누른 경우

    try {
      await apiRequest(`/admin/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || undefined }),
      });
      await fetchOrders();
      setOrderNoticeType('success');
      setOrderNotice('주문이 취소되었습니다. 결제가 완료된 주문은 환불 처리됩니다.');
    } catch (error) {
      setOrderNoticeType('error');
      setOrderNotice(error.message ?? '주문을 취소하지 못했습니다.');
    }
  };

  // Schedule handlers
  const handleScheduleSubmit = async (event) => {
    if (event) event.preventDefault();
    if (!selectedDay) return;

    try {
      const year = scheduleDate.getFullYear();
      const month = scheduleDate.getMonth();
      // UTC 변환 문제 방지: 로컬 날짜를 YYYY-MM-DD 형식으로 전송
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T12:00:00.000Z`;

      await apiRequest('/schedules', {
        method: 'POST',
        body: JSON.stringify({
          date: dateStr,
          status: 'unavailable',
          note: '',
        }),
      });

      setScheduleNoticeType('success');
      setScheduleNotice('수업 불가로 설정되었습니다.');
      setSelectedDay(null);
      await fetchSchedules();
    } catch (error) {
      setScheduleNoticeType('error');
      setScheduleNotice(error.message ?? '일정 저장에 실패했습니다.');
    }
  };

  const handleScheduleDelete = async () => {
    if (!selectedDay) return;

    const schedule = getScheduleForDay(selectedDay);
    if (!schedule) return;

    try {
      await apiRequest(`/schedules/${schedule._id}`, {
        method: 'DELETE',
      });

      setScheduleNoticeType('success');
      setScheduleNotice('수업 가능으로 되돌렸습니다.');
      setSelectedDay(null);
      await fetchSchedules();
    } catch (error) {
      setScheduleNoticeType('error');
      setScheduleNotice(error.message ?? '일정 삭제에 실패했습니다.');
    }
  };

  const handleDayClick = (day) => {
    const year = scheduleDate.getFullYear();
    const month = scheduleDate.getMonth();
    const dateObj = new Date(year, month, day);
    dateObj.setHours(0, 0, 0, 0);

    const existing = schedules.find((s) => {
      const sDate = new Date(s.date);
      sDate.setHours(0, 0, 0, 0);
      return sDate.getTime() === dateObj.getTime();
    });

    setSelectedDay(day);
    if (existing) {
      setScheduleForm({ status: existing.status, note: existing.note || '' });
    } else {
      setScheduleForm({ status: 'unavailable', note: '' });
    }
  };

  const getScheduleForDay = (day) => {
    const year = scheduleDate.getFullYear();
    const month = scheduleDate.getMonth();
    const dateObj = new Date(year, month, day);
    dateObj.setHours(0, 0, 0, 0);

    return schedules.find((s) => {
      const sDate = new Date(s.date);
      sDate.setHours(0, 0, 0, 0);
      return sDate.getTime() === dateObj.getTime();
    });
  };

  const schedulePrevMonth = () => {
    setScheduleDate(new Date(scheduleDate.getFullYear(), scheduleDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const scheduleNextMonth = () => {
    setScheduleDate(new Date(scheduleDate.getFullYear(), scheduleDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const renderAdminCalendar = () => {
    const year = scheduleDate.getFullYear();
    const month = scheduleDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="admin-calendar-day admin-calendar-day--empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const schedule = getScheduleForDay(day);
      const statusOption = schedule ? SCHEDULE_STATUS_OPTIONS.find((o) => o.value === schedule.status) : null;

      days.push(
        <div
          key={day}
          className={`admin-calendar-day ${selectedDay === day ? 'admin-calendar-day--selected' : ''}`}
          onClick={() => handleDayClick(day)}
          style={statusOption ? { backgroundColor: statusOption.color + '20', borderColor: statusOption.color } : {}}
        >
          <span className="admin-calendar-day__number">{day}</span>
          {statusOption && <span className="admin-calendar-day__status" style={{ color: statusOption.color }}>{statusOption.label}</span>}
        </div>
      );
    }

    return (
      <div className="admin-calendar">
        <div className="admin-calendar-header">
          <button type="button" onClick={schedulePrevMonth} className="calendar-nav-btn">&lt;</button>
          <h3>{year}년 {monthNames[month]}</h3>
          <button type="button" onClick={scheduleNextMonth} className="calendar-nav-btn">&gt;</button>
        </div>
        <div className="admin-calendar-weekdays">
          {weekDays.map((d) => <div key={d} className="admin-calendar-weekday">{d}</div>)}
        </div>
        <div className="admin-calendar-days">
          {days}
        </div>
      </div>
    );
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
        <h3>관리자 대시보드</h3>
        <p>상품 정보를 생성, 수정, 삭제하고 이미지 관리까지 수행할 수 있습니다.</p>
      </header>

      <AdminFormNotice status={status} statusType={statusType} />

      <main>
        <section className="product-form">
          <h4>{pageTitle}</h4>
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
                  step="10"
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

            <div className="options-editor options-editor--aside">
              <div className="options-header">
                <h3>상품 옵션 설정</h3>
                <button type="button" onClick={() => setForm((prev) => ({
                  ...prev,
                  options: [...prev.options, { name: '', values: [], required: false }]
                }))}>+ 옵션 추가</button>
              </div>
              <p className="muted-text">상품 구매 시 선택할 수 있는 옵션을 설정합니다. (예: 디자인 선택, 색상 등)</p>

              {form.options.length === 0 && (
                <p className="muted-text">등록된 옵션이 없습니다.</p>
              )}

              <div className="options-list">
                {form.options.map((option, index) => (
                  <div key={index} className="option-card">
                    <div className="option-row">
                      <input
                        type="text"
                        value={option.name}
                        onChange={(e) => {
                          const newOptions = [...form.options];
                          newOptions[index].name = e.target.value;
                          setForm((prev) => ({ ...prev, options: newOptions }));
                        }}
                        placeholder="옵션명 (예: 내지디자인)"
                      />
                      <label className="option-required">
                        <input
                          type="checkbox"
                          checked={option.required}
                          onChange={(e) => {
                            const newOptions = [...form.options];
                            newOptions[index].required = e.target.checked;
                            setForm((prev) => ({ ...prev, options: newOptions }));
                          }}
                        />
                        필수
                      </label>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            options: prev.options.filter((_, i) => i !== index),
                          }));
                        }}
                      >
                        삭제
                      </button>
                    </div>

                    <div className="option-values">
                      <input
                        type="text"
                        placeholder="옵션값 입력 후 Enter (예: 만슬리, 라인)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.target.value.trim();
                            if (!value) return;
                            const newOptions = [...form.options];
                            newOptions[index].values = [...new Set([...newOptions[index].values, value])];
                            setForm((prev) => ({ ...prev, options: newOptions }));
                            e.target.value = '';
                          }
                        }}
                      />
                      <div className="option-value-chips">
                        {option.values.map((value, valueIndex) => (
                          <span key={valueIndex} className="chip">
                            {value}
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = [...form.options];
                                newOptions[index].values = newOptions[index].values.filter((_, i) => i !== valueIndex);
                                setForm((prev) => ({ ...prev, options: newOptions }));
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                상품 설명 (간략)
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

            <div className="detail-blocks-editor">
              <div className="detail-blocks-header">
                <h3>상세 페이지 블록 편집</h3>
                <div className="detail-blocks-actions">
                  <button type="button" onClick={() => setForm((prev) => ({
                    ...prev,
                    detailBlocks: [...prev.detailBlocks, { type: 'text', content: '' }]
                  }))}>+ 텍스트</button>
                  <button type="button" onClick={() => setForm((prev) => ({
                    ...prev,
                    detailBlocks: [...prev.detailBlocks, { type: 'notice', content: '' }]
                  }))}>+ 주의사항</button>
                </div>
              </div>
              <p className="muted-text">텍스트, 이미지, 주의사항을 순서대로 배치하여 상세 페이지를 구성합니다.</p>

              {form.detailBlocks.length === 0 && (
                <p className="muted-text">등록된 블록이 없습니다. 위 버튼으로 블록을 추가하세요.</p>
              )}

              <div className="detail-blocks-list">
                {form.detailBlocks.map((block, index) => (
                  <div key={index} className={`detail-block detail-block--${block.type}`}>
                    <div className="detail-block-header">
                      <span className="detail-block-type">
                        {block.type === 'text' && '텍스트'}
                        {block.type === 'image' && '이미지'}
                        {block.type === 'notice' && '주의사항'}
                      </span>
                      <div className="detail-block-controls">
                        {index > 0 && (
                          <button type="button" onClick={() => {
                            const newBlocks = [...form.detailBlocks];
                            [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
                            setForm((prev) => ({ ...prev, detailBlocks: newBlocks }));
                          }}>↑</button>
                        )}
                        {index < form.detailBlocks.length - 1 && (
                          <button type="button" onClick={() => {
                            const newBlocks = [...form.detailBlocks];
                            [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
                            setForm((prev) => ({ ...prev, detailBlocks: newBlocks }));
                          }}>↓</button>
                        )}
                        <button type="button" className="danger" onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            detailBlocks: prev.detailBlocks.filter((_, i) => i !== index)
                          }));
                        }}>삭제</button>
                      </div>
                    </div>

                    {(block.type === 'text' || block.type === 'notice') && (
                      <textarea
                        value={block.content}
                        onChange={(e) => {
                          const newBlocks = [...form.detailBlocks];
                          newBlocks[index] = { ...block, content: e.target.value };
                          setForm((prev) => ({ ...prev, detailBlocks: newBlocks }));
                        }}
                        placeholder={block.type === 'notice' ? '주의사항 내용을 입력하세요.' : '텍스트 내용을 입력하세요.'}
                        rows={4}
                      />
                    )}

                    {block.type === 'image' && (
                      <div className="detail-block-image">
                        {block.url ? (
                          <img src={block.url} alt="상세 이미지" />
                        ) : (
                          <p className="muted-text">이미지가 없습니다.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="detail-blocks-image-upload">
                <button type="button" onClick={() => {
                  if (!window.cloudinary) {
                    setStatusType('error');
                    setStatus(widgetMessage || '이미지 업로드 위젯을 사용할 수 없습니다.');
                    return;
                  }
                  // 상세 이미지 업로드용 별도 위젯 생성 (widgetRef.current를 덮어쓰지 않음)
                  const detailWidget = window.cloudinary.createUploadWidget(
                    {
                      cloudName,
                      uploadPreset,
                      multiple: false,
                      maxFiles: 1,
                      resourceType: 'image',
                      folder: 'shoppingmall/details',
                      clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                      maxFileSize: MAX_IMAGE_SIZE,
                    },
                    (error, result) => {
                      if (error) {
                        console.error('[cloudinary] detail image error', error);
                        return;
                      }
                      if (result && result.event === 'success') {
                        const info = result.info;
                        setForm((prev) => ({
                          ...prev,
                          detailBlocks: [...prev.detailBlocks, {
                            type: 'image',
                            url: info.secure_url ?? info.url,
                            publicId: info.public_id,
                            content: ''
                          }]
                        }));
                      }
                    }
                  );
                  detailWidget.open();
                }} disabled={!widgetReady}>+ 상세 이미지 업로드</button>
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

                <ProductListSection
          products={products}
          onRefresh={fetchProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          getCategoryLabel={getCategoryLabel}
        />

                <OrdersSection
          orders={orders}
          ordersLoading={ordersLoading}
          ordersError={ordersError}
          orderNotice={orderNotice}
          orderNoticeType={orderNoticeType}
          onRefresh={fetchOrders}
          onUpdateStatus={handleUpdateOrderStatus}
          onUpdateTracking={handleUpdateTracking}
          onCancel={handleAdminCancelOrder}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          statusOptions={ORDER_STATUS_OPTIONS}
        />

                <InvitesSection
          invites={invites}
          invitesLoading={invitesLoading}
          inviteError={inviteError}
          inviteNotice={inviteNotice}
          inviteNoticeType={inviteNoticeType}
          inviteForm={inviteForm}
          isCreatingInvite={isCreatingInvite}
          onRefresh={fetchInvites}
          onSubmit={handleCreateInvite}
          onChangeForm={setInviteForm}
          onCopyCode={handleCopyInviteCode}
          onRevoke={handleRevokeInvite}
          formatDate={formatDate}
        />

                <ScheduleSection
          schedulesLoading={schedulesLoading}
          scheduleNotice={scheduleNotice}
          scheduleNoticeType={scheduleNoticeType}
          renderCalendar={renderAdminCalendar}
          selectedDay={selectedDay}
          scheduleDate={scheduleDate}
          getScheduleForDay={getScheduleForDay}
          onSubmit={handleScheduleSubmit}
          onDelete={handleScheduleDelete}
          onClose={() => setSelectedDay(null)}
        />
      </main>
    </div>
  );
}

export default Admin;





