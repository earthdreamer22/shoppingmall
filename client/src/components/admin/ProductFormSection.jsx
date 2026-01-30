import PropTypes from "prop-types";
import { useState } from "react";

function ProductFormSection({
  pageTitle,
  form,
  setForm,
  onSubmit,
  isSubmitting,
  resetForm,
  editingProductId,
  productCategories,
  widgetReady,
  widgetMessage,
  onOpenUploadWidget,
  onSetPrimaryImage,
  onRemoveImage,
  onAddDetailImage,
}) {
  const [optionInputs, setOptionInputs] = useState({});

  const addOptionValue = (idx) => {
    const raw = (optionInputs[idx] ?? "").trim();
    if (!raw) return;

    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => {
        if (i !== idx) return option;
        const values = option.values ? [...option.values] : [];
        if (!values.includes(raw)) {
          values.push(raw);
        }
        return { ...option, values };
      }),
    }));

    setOptionInputs((prev) => ({ ...prev, [idx]: "" }));
  };

  const removeOptionValue = (idx, value) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => {
        if (i !== idx) return option;
        return {
          ...option,
          values: (option.values || []).filter((v) => v !== value),
        };
      }),
    }));
  };

  const handleOptionValueKey = (idx, event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addOptionValue(idx);
    }
  };

  const moveDetailBlock = (idx, direction) => {
    setForm((prev) => {
      const blocks = [...prev.detailBlocks];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= blocks.length) return prev;
      [blocks[idx], blocks[targetIdx]] = [blocks[targetIdx], blocks[idx]];
      return { ...prev, detailBlocks: blocks };
    });
  };

  return (
    <section className="product-form">
      <h4>{pageTitle}</h4>
      <form onSubmit={onSubmit} className="admin-form">
        <div className="product-form-grid-4">
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
            배송비 (원)
            <input
              type="number"
              min="0"
              step="500"
              name="shippingFee"
              value={form.shippingFee}
              onChange={(event) => setForm((prev) => ({ ...prev, shippingFee: event.target.value }))}
              placeholder="기본 배송비 (500원 단위)"
            />
          </label>
        </div>

        <div className="product-form-row">
          <div className="product-card">
            <h4>상품 카테고리</h4>
            <select
              name="category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              {productCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <small className="muted-text">헌 책 보수, 제본, 커스텀 제작 서비스</small>
          </div>

          <div className="product-card product-options-card">
            <div className="card-header">
              <h4>상품 옵션 설정</h4>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    options: [...(prev.options || []), { name: '', values: [] }],
                  }))
                }
              >
                + 옵션 추가
              </button>
            </div>
            <p className="muted-text">옵션 이름과 값을 추가하세요. 값은 Enter로 추가, 칩을 클릭해 삭제합니다.</p>
            {form.options?.length ? (
              <div className="option-list">
                {form.options.map((option, idx) => (
                  <div key={idx} className="option-row">
                    <input
                      type="text"
                      placeholder="옵션 이름"
                      value={option.name}
                      onChange={(event) => {
                        const value = event.target.value;
                        setForm((prev) => ({
                          ...prev,
                          options: prev.options.map((o, i) => (i === idx ? { ...o, name: value } : o)),
                        }));
                      }}
                    />

                    <div className="option-values">
                      {(option.values || []).map((value) => (
                        <span
                          key={value}
                          className="badge badge--muted option-chip"
                        >
                          {value}
                          <button
                            type="button"
                            className="danger"
                            onClick={() => removeOptionValue(idx, value)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="option-value-input">
                      <input
                        type="text"
                        placeholder="값 입력 후 Enter"
                        value={optionInputs[idx] ?? ''}
                        onChange={(event) => setOptionInputs((prev) => ({ ...prev, [idx]: event.target.value }))}
                        onKeyDown={(event) => handleOptionValueKey(idx, event)}
                      />
                      <button type="button" onClick={() => addOptionValue(idx)}>
                        추가
                      </button>
                    </div>

                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          options: prev.options.filter((_, i) => i !== idx),
                        }));
                      }}
                    >
                      옵션 삭제
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-text">등록된 옵션이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="product-form-row">
          <div className="product-card product-images-card">
            <div className="card-header">
              <h4>상품 이미지</h4>
              <button type="button" onClick={onOpenUploadWidget} disabled={!widgetReady}>
                이미지 업로드
              </button>
            </div>
            <p className="muted-text">업로드된 이미지가 없거나 대표 이미지를 포함해 최소 한 장 등록해주세요.</p>
            {widgetMessage && <p className="muted-text">{widgetMessage}</p>}
            <div className="product-images-grid">
              {form.images.length ? (
                form.images.map((image, idx) => (
                  <div key={image.publicId} className="product-image-item">
                    <img src={image.url} alt={`상품 이미지 ${idx + 1}`} />
                    <div className="product-image-name">
                      {form.name?.trim() || '상품명 미입력'}
                    </div>
                    <div className="image-actions">
                      <button
                        type="button"
                        onClick={() => onSetPrimaryImage(image.publicId)}
                        className={image.isPrimary ? 'primary' : ''}
                      >
                        대표 이미지로 설정
                      </button>
                      <button type="button" className="danger" onClick={() => onRemoveImage(image.publicId)}>
                        삭제
                      </button>
                    </div>
                    {image.isPrimary && <span className="badge">대표</span>}
                  </div>
                ))
              ) : (
                <p className="muted-text">등록된 이미지가 없습니다.</p>
              )}
            </div>
          </div>

          <div className="product-card product-description-card">
            <h4>상품 설명 (간략)</h4>
            <textarea
              name="description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="상품 상세 설명을 입력해주세요."
            />
          </div>
        </div>

        <div className="product-card product-detail-blocks-card">
          <div className="card-header">
            <h4>상세 페이지 블록 편집</h4>
            <div className="detail-block-actions">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, detailBlocks: [...prev.detailBlocks, { type: 'text', content: '' }] }))}
              >
                + 텍스트
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    detailBlocks: [...prev.detailBlocks, { type: 'notice', content: '' }],
                  }))
                }
              >
                + 주의사항
              </button>
              <button type="button" onClick={onAddDetailImage} disabled={!widgetReady}>
                + 상세 이미지 업로드
              </button>
            </div>
          </div>

          <div className="detail-block-list">
            {form.detailBlocks.length ? (
              form.detailBlocks.map((block, idx) => (
                <div key={idx} className="detail-block">
                  <div className="detail-block-header">
                    <span className="detail-block-type">
                      {block.type === 'text' ? '텍스트' : block.type === 'notice' ? '주의사항' : '상세 이미지'}
                    </span>
                    <div className="detail-block-controls">
                      <button type="button" onClick={() => moveDetailBlock(idx, 'up')}>▲</button>
                      <button type="button" onClick={() => moveDetailBlock(idx, 'down')}>▼</button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextType =
                            block.type === 'text' ? 'notice' : block.type === 'notice' ? 'image' : 'text';
                          setForm((prev) => ({
                            ...prev,
                            detailBlocks: prev.detailBlocks.map((b, i) =>
                              i === idx ? { ...b, type: nextType } : b
                            ),
                          }));
                        }}
                      >
                        타입 변경
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => setForm((prev) => ({
                          ...prev,
                          detailBlocks: prev.detailBlocks.filter((_, i) => i !== idx),
                        }))}
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {block.type === 'text' && (
                    <textarea
                      placeholder="텍스트 블록 내용"
                      value={block.content ?? ''}
                      onChange={(event) => {
                        const content = event.target.value;
                        setForm((prev) => ({
                          ...prev,
                          detailBlocks: prev.detailBlocks.map((b, i) => (i === idx ? { ...b, content } : b)),
                        }));
                      }}
                    />
                  )}
                  {block.type === 'notice' && (
                    <textarea
                      placeholder="주의사항 내용"
                      value={block.content ?? ''}
                      onChange={(event) => {
                        const content = event.target.value;
                        setForm((prev) => ({
                          ...prev,
                          detailBlocks: prev.detailBlocks.map((b, i) => (i === idx ? { ...b, content } : b)),
                        }));
                      }}
                    />
                  )}
                  {block.type === 'image' && (
                    <div className="detail-image-item">
                      <img src={block.url} alt={`상세 이미지 ${idx + 1}`} />
                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            detailBlocks: prev.detailBlocks.filter((_, i) => i !== idx),
                          }));
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="muted-text">등록된 블록이 없습니다. 위 버튼으로 블록을 추가하세요.</p>
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
  );
}

ProductFormSection.propTypes = {
  pageTitle: PropTypes.string.isRequired,
  form: PropTypes.object.isRequired,
  setForm: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  resetForm: PropTypes.func.isRequired,
  editingProductId: PropTypes.string,
  productCategories: PropTypes.array.isRequired,
  widgetReady: PropTypes.bool.isRequired,
  widgetMessage: PropTypes.string,
  onOpenUploadWidget: PropTypes.func.isRequired,
  onSetPrimaryImage: PropTypes.func.isRequired,
  onRemoveImage: PropTypes.func.isRequired,
  onAddDetailImage: PropTypes.func.isRequired,
};

export default ProductFormSection;
