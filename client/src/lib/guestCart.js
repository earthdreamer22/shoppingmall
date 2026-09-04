// 비회원(게스트) 장바구니: 서버 대신 localStorage에 보관한다.
// 회원 장바구니 흐름은 건드리지 않고, 비로그인 상태에서만 사용한다.
const STORAGE_KEY = 'guest:cart';
export const GUEST_CART_EVENT = 'guestcart:change';

function readRaw() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function writeRaw(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(GUEST_CART_EVENT));
  } catch (_error) {
    // 저장 실패는 조용히 무시
  }
}

function optionKey(selectedOptions = []) {
  return selectedOptions
    .map((opt) => `${opt.name}:${opt.value}`)
    .sort()
    .join('|');
}

// UI가 회원 장바구니 아이템과 동일하게 다룰 수 있도록 id 필드를 부여한다.
export function getGuestCart() {
  return readRaw().map((item) => ({ ...item, id: item.key }));
}

export function getGuestCartCount() {
  return readRaw().reduce((sum, item) => sum + (item.quantity ?? 0), 0);
}

export function addGuestItem({ productId, name, price, quantity, selectedOptions = [], imageUrl = '', shippingFee = 0 }) {
  const items = readRaw();
  const key = `${productId}__${optionKey(selectedOptions)}`;
  const existing = items.find((item) => item.key === key);
  if (existing) {
    existing.quantity = Math.min(999, existing.quantity + quantity);
  } else {
    items.push({ key, productId, name, price, quantity, selectedOptions, imageUrl, shippingFee });
  }
  writeRaw(items);
  return getGuestCartCount();
}

export function updateGuestQuantity(key, quantity) {
  const items = readRaw();
  const target = items.find((item) => item.key === key);
  if (target) {
    target.quantity = Math.max(1, Math.min(999, quantity));
    writeRaw(items);
  }
  return getGuestCartCount();
}

export function removeGuestItem(key) {
  const items = readRaw().filter((item) => item.key !== key);
  writeRaw(items);
  return getGuestCartCount();
}

export function clearGuestCart() {
  writeRaw([]);
}
