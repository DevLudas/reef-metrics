import type { ParameterStatus } from "@/types";

/**
 * Result of parameter status calculation
 */
export interface StatusCalculationResult {
  status: ParameterStatus;
  deviationPercentage: number | null;
}

/**
 * Calculate parameter status based on current value and optimal range
 *
 * @param currentValue - The current parameter value (null if no measurement)
 * @param optimalMin - Minimum optimal value
 * @param optimalMax - Maximum optimal value
 * @returns Object containing status and deviation percentage
 *
 * Status rules:
 * - 'no_data': currentValue is null
 * - 'normal': deviation < 10%
 * - 'warning': deviation >= 10% and < 20%
 * - 'critical': deviation >= 20%
 */
export function calculateStatus(
  currentValue: number | null,
  optimalMin: number,
  optimalMax: number
): StatusCalculationResult {
  // Handle missing data
  if (currentValue === null) {
    return { status: "no_data", deviationPercentage: null };
  }

  // Calculate deviation percentage
  const deviation = calculateDeviation(currentValue, optimalMin, optimalMax);

  // Determine status based on deviation thresholds
  if (deviation < 10) {
    return { status: "normal", deviationPercentage: deviation };
  } else if (deviation < 20) {
    return { status: "warning", deviationPercentage: deviation };
  } else {
    return { status: "critical", deviationPercentage: deviation };
  }
}

/**
 * Calculate deviation percentage from optimal range
 *
 * @param currentValue - The current parameter value
 * @param optimalMin - Minimum optimal value
 * @param optimalMax - Maximum optimal value
 * @returns Deviation percentage (0 if within range)
 *
 * Calculation:
 * - If below min: ((min - current) / min) * 100
 * - If above max: ((current - max) / max) * 100
 * - If within range: 0
 */
export function calculateDeviation(currentValue: number, optimalMin: number, optimalMax: number): number {
  // Value is below optimal range
  if (currentValue < optimalMin) {
    return ((optimalMin - currentValue) / optimalMin) * 100;
  }

  // Value is above optimal range
  if (currentValue > optimalMax) {
    return ((currentValue - optimalMax) / optimalMax) * 100;
  }

  // Value is within optimal range
  return 0;
}

/**
 * Format timestamp as relative time (e.g., "2 hours ago", "3 days ago")
 *
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle invalid dates
  if (isNaN(diffInSeconds)) {
    return "Invalid date";
  }

  // Less than a minute
  if (diffInSeconds < 60) {
    return "just now";
  }

  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  // Less than a week
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  // Less than a month
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
  }

  // Format as date
  return date.toLocaleDateString();
}

/**
 * Get status color for visual indicators
 *
 * @param status - Parameter status
 * @returns Tailwind color class
 */
export function getStatusColor(status: ParameterStatus): string {
  switch (status) {
    case "normal":
      return "text-green-600 border-green-600";
    case "warning":
      return "text-orange-600 border-orange-600";
    case "critical":
      return "text-red-600 border-red-600";
    case "no_data":
      return "text-gray-400 border-gray-400";
  }
}

/**
 * Get status background color for badges
 *
 * @param status - Parameter status
 * @returns Tailwind background color class
 */
export function getStatusBgColor(status: ParameterStatus): string {
  switch (status) {
    case "normal":
      return "bg-green-100 text-green-800";
    case "warning":
      return "bg-orange-100 text-orange-800";
    case "critical":
      return "bg-red-100 text-red-800";
    case "no_data":
      return "bg-gray-100 text-gray-600";
  }
}

/**
 * Get status label for display
 *
 * @param status - Parameter status
 * @returns Human-readable status label
 */
export function getStatusLabel(status: ParameterStatus): string {
  switch (status) {
    case "normal":
      return "Normal";
    case "warning":
      return "Warning";
    case "critical":
      return "Critical";
    case "no_data":
      return "No Data";
  }
}
