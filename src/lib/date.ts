/**
 * Date utility functions using date-fns with i18n support
 */
import {
  addDays,
  differenceInDays,
  endOfDay,
  format,
  formatDistance,
  formatDistanceToNow,
  formatRelative,
  isToday,
  isTomorrow,
  isValid,
  isYesterday,
  type Locale,
  parse,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { enUS, es, fr } from "date-fns/locale";

/**
 * Map Lingui locales to date-fns locales
 */
const LOCALE_MAP = {
  en: enUS,
  fr,
  sp: es, // Spanish uses 'es' in date-fns
} as const;

type SupportedLocale = keyof typeof LOCALE_MAP;

/**
 * Get date-fns locale object from locale string
 */
export function getDateFnsLocale(locale: string): Locale {
  return LOCALE_MAP[locale as SupportedLocale] || LOCALE_MAP.en;
}

/**
 * Format date for HTML date input (YYYY-MM-DD)
 * @param date Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "yyyy-MM-dd");
}

/**
 * Format date with full locale-aware formatting
 * @param date Date to format
 * @param locale Current locale
 * @returns Formatted date string (e.g., "Monday, November 11, 2025")
 */
export function formatFullDate(date: Date | string, locale: string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "PPPP", { locale: getDateFnsLocale(locale) });
}

/**
 * Format date with short locale-aware formatting
 * @param date Date to format
 * @param locale Current locale
 * @returns Formatted date string (e.g., "Nov 11, 2025")
 */
export function formatShortDate(date: Date | string, locale: string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "PP", { locale: getDateFnsLocale(locale) });
}

/**
 * Format date for chart displays (short month and day)
 * @param date Date to format
 * @param locale Current locale
 * @returns Formatted date string (e.g., "Nov 11")
 */
export function formatChartDate(date: Date | string, locale: string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "MMM d", { locale: getDateFnsLocale(locale) });
}

/**
 * Format date with medium locale-aware formatting
 * @param date Date to format
 * @param locale Current locale
 * @returns Formatted date string (e.g., "Nov 11, 2025")
 */
export function formatMediumDate(date: Date | string, locale: string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "MMM d, yyyy", { locale: getDateFnsLocale(locale) });
}

/**
 * Format relative date (e.g., "yesterday", "today", "tomorrow", "last Friday")
 * @param date Date to format
 * @param locale Current locale
 * @param baseDate Base date for comparison (defaults to now)
 * @returns Formatted relative date string
 */
export function formatRelativeDate(
  date: Date | string,
  locale: string,
  baseDate?: Date
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return formatRelative(d, baseDate || new Date(), {
    locale: getDateFnsLocale(locale),
  });
}

/**
 * Format distance from now (e.g., "3 hours ago", "in 2 days")
 * @param date Date to format
 * @param locale Current locale
 * @param addSuffix Add "ago" or "in" suffix
 * @returns Formatted distance string
 */
export function formatTimeAgo(
  date: Date | string,
  locale: string,
  addSuffix = true
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return formatDistanceToNow(d, {
    locale: getDateFnsLocale(locale),
    addSuffix,
  });
}

/**
 * Format distance between two dates
 * @param date Date to format
 * @param baseDate Base date for comparison
 * @param locale Current locale
 * @param addSuffix Add "ago" or "in" suffix
 * @returns Formatted distance string
 */
export function formatDateDistance(
  date: Date | string,
  baseDate: Date | string,
  locale: string,
  addSuffix = true
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const base = typeof baseDate === "string" ? parseISO(baseDate) : baseDate;
  if (!(isValid(d) && isValid(base))) return "";
  return formatDistance(d, base, {
    locale: getDateFnsLocale(locale),
    addSuffix,
  });
}

/**
 * Check if date is today
 */
export function checkIsToday(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  return isValid(d) && isToday(d);
}

/**
 * Check if date is yesterday
 */
export function checkIsYesterday(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  return isValid(d) && isYesterday(d);
}

/**
 * Check if date is tomorrow
 */
export function checkIsTomorrow(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  return isValid(d) && isTomorrow(d);
}

/**
 * Parse ISO date string
 */
export function parseDateISO(dateString: string): Date | null {
  const d = parseISO(dateString);
  return isValid(d) ? d : null;
}

/**
 * Parse date string with format
 */
export function parseDate(
  dateString: string,
  formatString: string
): Date | null {
  const d = parse(dateString, formatString, new Date());
  return isValid(d) ? d : null;
}

/**
 * Validate date
 */
export function isValidDate(date: unknown): boolean {
  if (date instanceof Date) return isValid(date);
  if (typeof date === "string") return isValid(parseISO(date));
  return false;
}

/**
 * Get start of day
 */
export function getStartOfDay(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return startOfDay(d);
}

/**
 * Get end of day
 */
export function getEndOfDay(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return endOfDay(d);
}

/**
 * Add days to date
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return addDays(d, days);
}

/**
 * Subtract days from date
 */
export function subtractDaysFromDate(date: Date | string, days: number): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return subDays(d, days);
}

/**
 * Get difference in days between two dates
 */
export function getDaysDifference(
  dateLeft: Date | string,
  dateRight: Date | string
): number {
  const left = typeof dateLeft === "string" ? parseISO(dateLeft) : dateLeft;
  const right = typeof dateRight === "string" ? parseISO(dateRight) : dateRight;
  return differenceInDays(left, right);
}
