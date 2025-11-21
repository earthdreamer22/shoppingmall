const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    addressPostalCode: { type: String, default: '' },
    addressLine1: { type: String, default: '' },
    addressLine2: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    consentPrivacy: { type: Boolean, default: false },
    consentTerms: { type: Boolean, default: false },
    consentMarketing: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        const { _id, __v, password, ...rest } = ret;
        return { id: _id.toString(), ...rest };
      },
    },
  },
);

module.exports = model('User', userSchema);
