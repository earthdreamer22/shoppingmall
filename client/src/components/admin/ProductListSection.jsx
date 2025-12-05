import PropTypes from 'prop-types';

function ProductListSection({ products, onRefresh, onEdit, onDelete, getCategoryLabel }) {
  return (
    <section className="products">
      <div className="section-header">
        <h2>상품 목록</h2>
        <button type="button" onClick={onRefresh}>
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
                <span className="badge badge--muted">배송비 \ {(product.shippingFee ?? 0).toLocaleString()}</span>
              </div>
              <p className="price">\ {product.price?.toLocaleString?.() ?? product.price}</p>
              <p className="description">{product.description}</p>
            </div>

            <div className="product-actions">
              <button type="button" onClick={() => onEdit(product)}>
                수정
              </button>
              <button type="button" className="danger" onClick={() => onDelete(product.id)}>
                삭제
              </button>
            </div>
          </article>
        ))}

        {!products.length && <p>등록된 상품이 없습니다.</p>}
      </div>
    </section>
  );
}

ProductListSection.propTypes = {
  products: PropTypes.array.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  getCategoryLabel: PropTypes.func.isRequired,
};

export default ProductListSection;
