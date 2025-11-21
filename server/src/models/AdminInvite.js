const { Schema, model } = require('mongoose');

const adminInviteSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true, default: null },
    expiresAt: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: null },
    usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
);

module.exports = model('AdminInvite', adminInviteSchema);
