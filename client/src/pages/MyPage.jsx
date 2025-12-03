import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { apiRequest } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';

function MyPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest('/orders');
      setOrders(data);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      fetchOrders();
    }
  }, [loading, fetchOrders]);

  const handleCancelOrder = async (orderId) => {
    try {
      await apiRequest(`/orders/${orderId}`, { method: 'DELETE' });
      setStatusMessage('주문이 취소되었습니다.');
      await fetchOrders();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

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
          <h2>마이페이지</h2>
          <p>마이페이지를 보려면 로그인해주세요.</p>
          <button type="button" onClick={() => navigate('/login')}>
            로그인하기
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="App">
      <section className="mypage">
        <div className="mypage-header">
          <h2>마이페이지</h2>
          <p className="mypage-greeting">
            안녕하세요, <strong>{user.name || user.email}</strong>님
          </p>
        </div>

        {statusMessage && <div className="status">{statusMessage}</div>}

        <div className="mypage-section">
          <div className="section-header">
            <h3>주문 내역</h3>
            <button type="button" onClick={fetchOrders} disabled={isLoading}>
              새로고침
            </button>
          </div>

          {isLoading ? (
            <p>주문 내역을 불러오는 중입니다...</p>
          ) : orders.length === 0 ? (
            <div className="empty-orders">
              <p>주문 내역이 없습니다.</p>
              <button type="button" onClick={() => navigate('/')}>
                쇼핑하러 가기
              </button>
            </div>
          ) : (
            <ul className="order-list">
              {orders.map((order) => (
                <li key={order.id} className="order-item">
                  <div className="order-item__header">
                    <span className="order-item__id">주문번호: {order.id}</span>
                    <span className={`order-item__status order-item__status--${order.status}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="order-item__products">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="order-product">
                      <strong>{item.name}</strong> x {item.quantity}
                      {item.sku && (
                        <div style={{ fontSize: '0.9em', color: '#475569' }}>SKU {item.sku}</div>
                      )}
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div style={{ fontSize: '0.9em', color: '#64748b', marginTop: '4px' }}>
                          {item.selectedOptions.map((opt, oi) => (
                            <span key={oi}>
                              {opt.name}: {opt.value}
                                {oi < item.selectedOptions.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="order-item__body">
                    <span className="order-item__total">
                      ₩ {(order.pricing?.total ?? order.total ?? 0).toLocaleString()}
                    </span>
                  </div>

                  {(order.status === 'shipped' || order.status === 'delivered') && order.shipping && (
                    <div className="order-item__shipping">
                      {order.shipping.carrier && (
                        <p><strong>택배사:</strong> {order.shipping.carrier}</p>
                      )}
                      {order.shipping.trackingNumber && (
                        <p><strong>송장번호:</strong> {order.shipping.trackingNumber}</p>
                      )}
                    </div>
                  )}

                  {order.status !== 'cancelled' && (
                    <button
                      type="button"
                      className="order-item__cancel"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      주문 취소
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function getOrderStatusLabel(status) {
  const labels = {
    pending: '결제 대기',
    paid: '결제 완료',
    shipped: '배송 중',
    delivered: '배송 완료',
    cancelled: '취소됨',
  };
  return labels[status] || status;
}

export default MyPage;
