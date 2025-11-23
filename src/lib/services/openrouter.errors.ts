/**
 * OpenRouter Service Error Classes
 *
 * Custom error hierarchy for handling various OpenRouter API error scenarios.
 * Each error type represents a specific failure mode with appropriate context.
 */

/**
 * Base error class for all OpenRouter-related errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * Configuration error - invalid or missing API key
 */
export class OpenRouterConfigError extends OpenRouterError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "OpenRouterConfigError";
  }
}

/**
 * Network error - connection failures, timeouts, DNS issues
 */
export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "NETWORK_ERROR", undefined, details);
    this.name = "OpenRouterNetworkError";
  }
}

/**
 * Authentication error - invalid API key or expired credentials (HTTP 401)
 */
export class OpenRouterAuthError extends OpenRouterError {
  constructor(message: string) {
    super(message, "AUTH_ERROR", 401);
    this.name = "OpenRouterAuthError";
  }
}

/**
 * Rate limit error - too many requests (HTTP 429)
 */
export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message, "RATE_LIMIT_ERROR", 429);
    this.name = "OpenRouterRateLimitError";
  }
}

/**
 * Validation error - invalid request parameters (HTTP 400)
 */
export class OpenRouterValidationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "OpenRouterValidationError";
  }
}

/**
 * Model error - requested model doesn't exist or is unavailable (HTTP 404)
 */
export class OpenRouterModelError extends OpenRouterError {
  constructor(
    message: string,
    public modelName?: string
  ) {
    super(message, "MODEL_ERROR", 404);
    this.name = "OpenRouterModelError";
  }
}

/**
 * Token limit error - request or response exceeds token limits
 */
export class OpenRouterTokenLimitError extends OpenRouterError {
  constructor(
    message: string,
    public tokenCount?: number
  ) {
    super(message, "TOKEN_LIMIT_ERROR");
    this.name = "OpenRouterTokenLimitError";
  }
}

/**
 * Parse error - failed to parse API response
 */
export class OpenRouterParseError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "PARSE_ERROR", undefined, details);
    this.name = "OpenRouterParseError";
  }
}

/**
 * Timeout error - request took too long (>30 seconds)
 */
export class OpenRouterTimeoutError extends OpenRouterError {
  constructor(message: string) {
    super(message, "TIMEOUT_ERROR");
    this.name = "OpenRouterTimeoutError";
  }
}

/**
 * Payment error - insufficient credits (HTTP 402)
 */
export class OpenRouterPaymentError extends OpenRouterError {
  constructor(message: string) {
    super(message, "PAYMENT_ERROR", 402);
    this.name = "OpenRouterPaymentError";
  }
}
