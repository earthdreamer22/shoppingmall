const crypto = require('crypto');
const AdminInvite = require('../models/AdminInvite');
const { asyncHandler } = require('../utils/asyncHandler');
const { recordAuditLog } = require('../utils/auditLogger');
const { config } = require('../config/env');

function randomCode(length = 32) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

const DEFAULT_EXPIRES_HOURS = config.adminInvite.expiresHours;

function buildInviteResponse(invite) {
  if (!invite) return null;
  const plain = invite.toObject ? invite.toObject() : invite;
  return {
    id: plain._id?.toString?.() ?? plain.id,
    code: plain.code,
    email: plain.email,
    expiresAt: plain.expiresAt,
    createdAt: plain.createdAt,
    createdBy: plain.createdBy,
    usedAt: plain.usedAt,
    usedBy: plain.usedBy,
    updatedAt: plain.updatedAt,
  };
}

const listInvites = asyncHandler(async (_req, res) => {
  const invites = await AdminInvite.find().sort({ createdAt: -1 }).lean();
  res.json(invites.map(buildInviteResponse));
});

const createInvite = asyncHandler(async (req, res) => {
  const { email, expiresInHours } = req.body || {};
  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
  const hours = Number.isFinite(Number(expiresInHours)) && Number(expiresInHours) > 0
    ? Number(expiresInHours)
    : DEFAULT_EXPIRES_HOURS;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  const invite = await AdminInvite.create({
    code: randomCode(),
    email: normalizedEmail,
    expiresAt,
    createdBy: req.user?.id,
  });

  await recordAuditLog({
    action: 'admin.invite.create',
    userId: req.user?.id,
    ip: req.ip,
    metadata: { inviteId: invite.id, email: normalizedEmail, expiresAt },
  });

  res.status(201).json(buildInviteResponse(invite));
});

const revokeInvite = asyncHandler(async (req, res) => {
  const { inviteId } = req.params;
  const invite = await AdminInvite.findById(inviteId);
  if (!invite) {
    return res.status(404).json({ message: '초대 정보를 찾을 수 없습니다.' });
  }

  invite.expiresAt = new Date(Date.now() - 1000);
  if (!invite.usedAt) {
    invite.usedAt = new Date();
    invite.usedBy = null;
  }
  await invite.save();

  await recordAuditLog({
    action: 'admin.invite.revoke',
    userId: req.user?.id,
    ip: req.ip,
    metadata: { inviteId },
  });

  res.json(buildInviteResponse(invite));
});

module.exports = {
  listInvites,
  createInvite,
  revokeInvite,
};
