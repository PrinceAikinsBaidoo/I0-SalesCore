export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
}

export const ROLE_GROUPS = {
  adminOnly: [ROLES.ADMIN],
  adminManager: [ROLES.ADMIN, ROLES.MANAGER],
  allOperational: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],
}

export const roleHomeRoute = (role) => {
  if (role === ROLES.CASHIER) return '/pos'
  return '/dashboard'
}
