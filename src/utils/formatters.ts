export function formatCurrency(amount: number): string {
  // Convert to string with 2 decimal places multiplied by 100
  // Example: 1000.25 -> "100025"
  return Math.round(amount * 100).toString();
}

export function parseCurrency(amountStr: string): number {
  // Convert from API format to number
  // Example: "100025" -> 1000.25
  return parseInt(amountStr, 10) / 100;
}

export function formatDate(date: Date | string): string {
  // Convert to ISO 8601 format
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  // Format date range for API queries
  return `${formatDate(startDate)}..${formatDate(endDate)}`;
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}