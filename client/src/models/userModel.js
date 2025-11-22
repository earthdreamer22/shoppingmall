export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
});

export function createEmptyUser() {
  return {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    postalCode: '',
    addressLine1: '',
    addressLine2: '',
    role: USER_ROLES.USER,
    createdAt: new Date().toISOString(),
    consentPrivacy: false,
    consentTerms: false,
    consentMarketing: false,
    adminInviteCode: '',
  };
}

export function normalizeUserInput(input) {
  if (!input) return createEmptyUser();

  const role = typeof input.role === 'string' ? input.role.toLowerCase() : USER_ROLES.USER;
  const normalizedRole = Object.values(USER_ROLES).includes(role) ? role : USER_ROLES.USER;

  return {
    name: input.name ?? '',
    email: input.email ?? '',
    password: input.password ?? '',
    confirmPassword: input.confirmPassword ?? input.password ?? '',
    phone: input.phone ?? '',
    postalCode: input.postalCode ?? input.addressPostalCode ?? '',
    addressLine1: input.addressLine1 ?? input.address ?? '',
    addressLine2: input.addressLine2 ?? '',
    role: normalizedRole,
    createdAt: input.createdAt ?? new Date().toISOString(),
    consentPrivacy: Boolean(input.consentPrivacy),
    consentTerms: Boolean(input.consentTerms),
    consentMarketing: Boolean(input.consentMarketing),
    adminInviteCode: input.adminInviteCode ?? '',
  };
}
