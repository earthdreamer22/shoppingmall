export const PRODUCT_CATEGORIES = [
  {
    value: 'book_repair',
    label: 'Book Repair',
    description: '헌 책 보수, 제본, 커스텀 제작 서비스',
  },
  {
    value: 'class',
    label: 'Class',
    description: '워크숍·강의 등 교육 서비스',
  },
  {
    value: 'shop',
    label: 'Shop',
    description: '굿즈·도서 등 일반 판매 상품',
  },
];

const LABEL_MAP = PRODUCT_CATEGORIES.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export function getCategoryLabel(value) {
  return LABEL_MAP[value] ?? value;
}
