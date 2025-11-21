const bcrypt = require('bcrypt');
const User = require('../models/User');
const AdminInvite = require('../models/AdminInvite');
const { asyncHandler } = require('../utils/asyncHandler');

const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select('-password');
  res.json(users);
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('-password');
  if (!user) {
    return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
  }
  res.json(user);
});

const SALT_ROUNDS = 10;

const createUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone = '',
    address = '',
    addressPostalCode = '',
    addressLine1 = '',
    addressLine2 = '',
    role = 'user',
    createdAt,
    adminInviteCode,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: '이름, 이메일, 비밀번호는 필수입니다.' });
  }

  if (!addressPostalCode || !addressLine1) {
    return res.status(400).json({ message: '우편번호와 기본 주소를 모두 입력해주세요.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '비밀번호는 6자 이상이어야 합니다.' });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const normalizedRole = ['admin', 'user'].includes(String(role).toLowerCase())
    ? String(role).toLowerCase()
    : 'user';

  let invite = null;
  if (normalizedRole === 'admin') {
    const trimmedCode = adminInviteCode?.trim?.();
    if (!trimmedCode) {
      return res.status(403).json({ message: '관리자 초대 코드가 필요합니다.' });
    }

    invite = await AdminInvite.findOne({ code: trimmedCode });
    if (!invite) {
      return res.status(403).json({ message: '유효하지 않은 관리자 초대 코드입니다.' });
    }

    if (invite.usedAt) {
      return res.status(403).json({ message: '이미 사용된 초대 코드입니다.' });
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      return res.status(403).json({ message: '만료된 초대 코드입니다.' });
    }

    if (invite.email && invite.email !== normalizedEmail) {
      return res.status(403).json({ message: '초대된 이메일만 관리자 가입이 가능합니다.' });
    }
  }

  const payload = {
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone.trim?.() ?? phone,
    address: address.trim?.() ?? [addressLine1, addressLine2].filter(Boolean).join(' ').trim(),
    addressPostalCode: String(addressPostalCode ?? '').trim(),
    addressLine1: addressLine1.trim?.() ?? addressLine1,
    addressLine2: addressLine2.trim?.() ?? addressLine2,
    role: normalizedRole,
    consentPrivacy: Boolean(req.body.consentPrivacy),
    consentTerms: Boolean(req.body.consentTerms),
    consentMarketing: Boolean(req.body.consentMarketing),
  };

  if (createdAt) {
    payload.createdAt = new Date(createdAt);
  }

  const user = await User.create(payload);

  if (invite) {
    invite.usedAt = new Date();
    invite.usedBy = user._id;
    await invite.save();
  }
  res.status(201).json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updates = { ...req.body };

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
  }

  if (updates.email) {
    const normalizedEmail = String(updates.email).trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      const exists = await User.findOne({ email: normalizedEmail });
      if (exists && exists.id !== userId) {
        return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
      }
      user.email = normalizedEmail;
    }
  }

  if (updates.name) {
    user.name = updates.name.trim();
  }

  if (updates.phone !== undefined) {
    user.phone = updates.phone;
  }

  if (updates.address !== undefined) {
    user.address = updates.address;
  }

  let shouldSyncFullAddress = false;
  if (updates.addressPostalCode !== undefined) {
    user.addressPostalCode = updates.addressPostalCode;
  }

  if (updates.addressLine1 !== undefined) {
    user.addressLine1 = updates.addressLine1;
    shouldSyncFullAddress = true;
  }

  if (updates.addressLine2 !== undefined) {
    user.addressLine2 = updates.addressLine2;
    shouldSyncFullAddress = true;
  }

  if (shouldSyncFullAddress) {
    const fullAddress = [user.addressLine1, user.addressLine2].filter(Boolean).join(' ').trim();
    user.address = fullAddress;
  }

  if (updates.role) {
    const normalizedRole = ['admin', 'user'].includes(String(updates.role).toLowerCase())
      ? String(updates.role).toLowerCase()
      : user.role;
    user.role = normalizedRole;
  }

  if (updates.password) {
    if (String(updates.password).length < 6) {
      return res.status(400).json({ message: '비밀번호는 6자 이상이어야 합니다.' });
    }
    user.password = await bcrypt.hash(String(updates.password), SALT_ROUNDS);
  }

  if (typeof updates.consentPrivacy === 'boolean') {
    user.consentPrivacy = updates.consentPrivacy;
  }

  if (typeof updates.consentTerms === 'boolean') {
    user.consentTerms = updates.consentTerms;
  }

  if (typeof updates.consentMarketing === 'boolean') {
    user.consentMarketing = updates.consentMarketing;
  }

  if (updates.createdAt) {
    user.createdAt = new Date(updates.createdAt);
  }

  await user.save();
  const sanitized = user.toJSON();
  delete sanitized.password;
  res.json(sanitized);
});

const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
  }
  res.status(204).send();
});

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
