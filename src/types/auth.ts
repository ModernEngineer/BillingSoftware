export interface SessionPayload {
  userId: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
}

export const ROLE_NAMES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "ACCOUNTANT",
  "CASHIER",
  "STAFF",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];
