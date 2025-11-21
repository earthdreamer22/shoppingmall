const { Schema, model } = require('mongoose');

const auditLogSchema = new Schema(
  {
    action: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    ip: { type: String, default: '' },
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = model('AuditLog', auditLogSchema);
