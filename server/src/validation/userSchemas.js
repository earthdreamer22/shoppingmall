const { z } = require('../middleware/validate');

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);
const roleSchema = z.enum(['admin', 'user']).optional();

const createUserSchema = z.object({
  name: z.string().min(1),
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  addressPostalCode: z.string().optional().or(z.literal('')),
  addressLine1: z.string().optional().or(z.literal('')),
  addressLine2: z.string().optional().or(z.literal('')),
  role: roleSchema.default('user'),
  adminInviteCode: z.string().optional(),
  consentPrivacy: z.boolean().optional(),
  consentTerms: z.boolean().optional(),
  consentMarketing: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  addressPostalCode: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  role: roleSchema,
  consentPrivacy: z.boolean().optional(),
  consentTerms: z.boolean().optional(),
  consentMarketing: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
