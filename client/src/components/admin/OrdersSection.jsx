import PropTypes from 'prop-types';

function OrdersSection({
  orders,
  ordersLoading,
  ordersError,
  orderNotice,
  orderNoticeType,
  onRefresh,
  onUpdateStatus,
  onUpdateTracking,
  onCancel,
  formatCurrency,
  formatDate,
  statusOptions,
}) {
  return (
    <section className="admin-orders">
      <div className="section-header">
        <h2>주문 관리</h2>
        <button type="button" onClick={onRefresh}>
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
                <th>주문 상품</th>
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
                  <td>
                    <div className="order-items">
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '8px' }}>
                          <strong>{item.name}</strong> x {item.quantity}
                          {item.sku && (
                            <div style={{ fontSize: '0.85em', color: '#475569' }}>SKU {item.sku}</div>
                          )}
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <div style={{ fontSize: '0.85em', color: '#64748b' }}>
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
                      onChange={(event) => onUpdateStatus(order.id, event.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="order-shipping">
                      {order.status === 'shipped' || order.status === 'delivered' ? (
                        <>
                          <div style={{ marginTop: '8px' }}>
                            <select
                              value={order.shipping?.carrier || ''}
                              onChange={(e) =>
                                onUpdateTracking(order.id, e.target.value, order.shipping?.trackingNumber || '')
                              }
                              style={{ marginBottom: '4px', width: '100%' }}
                            >
                              <option value="">택배사 선택</option>
                              <option value="CJ대한통운">CJ대한통운</option>
                              <option value="한진택배">한진택배</option>
                              <option value="롯데택배">롯데택배</option>
                              <option value="우체국택배">우체국택배</option>
                              <option value="로젠택배">로젠택배</option>
                              <option value="경동택배">경동택배</option>
                            </select>
                            <input
                              type="text"
                              placeholder="송장번호"
                              value={order.shipping?.trackingNumber || ''}
                              onChange={(e) => onUpdateTracking(order.id, order.shipping?.carrier || '', e.target.value)}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <small>택배사: {order.shipping?.carrier || '-'}</small>
                          <small>송장: {order.shipping?.trackingNumber || '-'}</small>
                        </>
                      ) : (
                        <>
                          <small>택배사: {order.shipping?.carrier || '-'}</small>
                          <small>송장: {order.shipping?.trackingNumber || '-'}</small>
                        </>
                      )}
                      <small>배송 시작: {formatDate(order.shipping?.shippedAt)}</small>
                      <small>배송 완료: {formatDate(order.shipping?.deliveredAt)}</small>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => onCancel(order.id)}
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
  );
}

OrdersSection.propTypes = {
  orders: PropTypes.array.isRequired,
  ordersLoading: PropTypes.bool.isRequired,
  ordersError: PropTypes.string,
  orderNotice: PropTypes.string,
  orderNoticeType: PropTypes.string,
  onRefresh: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  onUpdateTracking: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  statusOptions: PropTypes.array.isRequired,
};

export default OrdersSection;
