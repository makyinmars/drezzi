export const UserRole = {
  GUEST: "GUEST",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TodoStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type TodoStatus = (typeof TodoStatus)[keyof typeof TodoStatus];

export const EnhancementStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export type EnhancementStatus =
  (typeof EnhancementStatus)[keyof typeof EnhancementStatus];

export const CreditTransactionType = {
  PURCHASE: "PURCHASE",
  USAGE: "USAGE",
  REFUND: "REFUND",
  BONUS: "BONUS",
  ADMIN: "ADMIN",
} as const;

export type CreditTransactionType =
  (typeof CreditTransactionType)[keyof typeof CreditTransactionType];

export const PaymentStatus = {
  PENDING: "PENDING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
