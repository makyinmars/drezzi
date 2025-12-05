import type { I18n } from "@lingui/core";
import { TRPCError } from "@trpc/server";

/**
 * Helper function to create translated tRPC errors
 */
export function createTranslatedError(
  i18n: I18n | undefined,
  code: "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" | "UNAUTHORIZED",
  fallbackMessage: string
) {
  // Use the fallback message as the translation key and fallback
  const message = i18n?._(fallbackMessage) ?? fallbackMessage;

  return new TRPCError({
    code,
    message,
  });
}

/**
 * Predefined error creators with i18n support
 */
export const createErrors = (i18n: I18n | undefined) => ({
  todoNotFound: () =>
    createTranslatedError(i18n, "NOT_FOUND", "Todo not found"),

  invalidInput: () =>
    createTranslatedError(i18n, "BAD_REQUEST", "Invalid input"),

  todoDeleteFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to delete todo"
    ),

  todoUpdateFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to update todo"
    ),

  todoCreateFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to create todo"
    ),

  profileNotFound: () =>
    createTranslatedError(i18n, "NOT_FOUND", "Profile not found"),

  profileForbidden: () =>
    createTranslatedError(
      i18n,
      "UNAUTHORIZED",
      "You don't have permission to access this profile"
    ),

  profileCreateFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to create profile"
    ),

  profileUpdateFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to update profile"
    ),

  profileDeleteFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to delete profile"
    ),

  profileUploadFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to upload profile photo"
    ),

  invalidProfileImage: () =>
    createTranslatedError(i18n, "BAD_REQUEST", "Invalid profile image"),

  garmentNotFound: () =>
    createTranslatedError(i18n, "NOT_FOUND", "Garment not found"),

  garmentForbidden: () =>
    createTranslatedError(
      i18n,
      "UNAUTHORIZED",
      "You don't have permission to access this garment"
    ),

  garmentCreateFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to create garment"
    ),

  garmentUpdateFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to update garment"
    ),

  garmentDeleteFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to delete garment"
    ),

  invalidGarmentImage: () =>
    createTranslatedError(i18n, "BAD_REQUEST", "Invalid garment image"),

  tryOnNotFound: () =>
    createTranslatedError(i18n, "NOT_FOUND", "Try-on not found"),

  tryOnForbidden: () =>
    createTranslatedError(
      i18n,
      "UNAUTHORIZED",
      "You don't have permission to access this try-on"
    ),

  tryOnCreateFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to create try-on"
    ),

  tryOnDeleteFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to delete try-on"
    ),

  tryOnEnqueueFailed: () =>
    createTranslatedError(
      i18n,
      "INTERNAL_SERVER_ERROR",
      "Failed to enqueue try-on job"
    ),

  tryOnStatusInvalid: () =>
    createTranslatedError(i18n, "BAD_REQUEST", "Invalid try-on status"),
});
