const AuditLog = require('../models/AuditLog');

async function recordAuditLog({ action, userId, ip, level = 'info', metadata = {} }) {
  try {
    await AuditLog.create({
      action,
      user: userId,
      ip,
      level,
      metadata,
    });
  } catch (error) {
    console.error('[audit] failed to record log', action, error.message);
  }
}

module.exports = {
  recordAuditLog,
};
