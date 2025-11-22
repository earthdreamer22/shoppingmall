import { USER_ROLES } from '../models/userModel.js';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from '../routers/userRouter.js';

function assertEmail(email) {
  if (!email) {
    throw new Error('이메일을 입력해주세요.');
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new Error('이메일 형식이 올바르지 않습니다.');
  }
}

function assertPassword(password, confirmPassword) {
  if (!password || password.length < 6) {
    throw new Error('비밀번호는 6자 이상이어야 합니다.');
  }

  if (password !== confirmPassword) {
    throw new Error('비밀번호 확인이 일치하지 않습니다.');
  }
}

function normalizeRole(role) {
  if (!role) return USER_ROLES.USER;
  const normalized = role.toLowerCase();
  return Object.values(USER_ROLES).includes(normalized) ? normalized : USER_ROLES.USER;
}

function assertName(name) {
  if (!name?.trim()) {
    throw new Error('이름을 입력해주세요.');
  }
}

function assertPhone(phone) {
  if (!phone?.trim()) {
    throw new Error('휴대전화 번호를 입력해주세요.');
  }
}

function assertAddress({ postalCode, addressLine1 }) {
  if (!postalCode || !addressLine1) {
    throw new Error('주소 검색을 완료해주세요.');
  }
}

export async function registerUser(form) {
  assertEmail(form.email);
  assertPassword(form.password, form.confirmPassword ?? form.password);
  assertName(form.name);
  assertPhone(form.phone);
  assertAddress({ postalCode: form.postalCode, addressLine1: form.addressLine1 });

  const username = form.name.trim();

  const payload = {
    name: username,
    phone: form.phone.trim(),
    email: form.email.trim(),
    consentPrivacy: Boolean(form.consentPrivacy),
    consentTerms: Boolean(form.consentTerms),
    consentMarketing: Boolean(form.consentMarketing),
    password: form.password,
    addressPostalCode: form.postalCode,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2 ?? '',
    address: [form.addressLine1, form.addressLine2].filter(Boolean).join(' ').trim(),
    role: normalizeRole(form.role),
    createdAt: form.createdAt ?? new Date().toISOString(),
    adminInviteCode: form.adminInviteCode?.trim(),
  };

  return createUser(payload);
}

export function fetchUsers() {
  return listUsers();
}

export function fetchUser(userId) {
  if (!userId) {
    throw new Error('userId가 필요합니다.');
  }
  return getUser(userId);
}

export function modifyUser(userId, updates) {
  if (!userId) {
    throw new Error('userId가 필요합니다.');
  }
  return updateUser(userId, {
    ...updates,
    role: updates?.role ? normalizeRole(updates.role) : undefined,
  });
}

export function removeUser(userId) {
  if (!userId) {
    throw new Error('userId가 필요합니다.');
  }
  return deleteUser(userId);
}
