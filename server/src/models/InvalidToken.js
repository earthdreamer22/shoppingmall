const { Schema, model } = require('mongoose');

const invalidTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  },
);

// TTL index ensures invalid tokens are removed automatically after expiry
invalidTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model('InvalidToken', invalidTokenSchema);
