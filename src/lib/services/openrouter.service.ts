/**
 * OpenRouter Service
 *
 * Provides an abstraction layer for interacting with the OpenRouter API.
 * Supports structured JSON responses with type safety and comprehensive error handling.
 */

import {
  OpenRouterError,
  OpenRouterConfigError,
  OpenRouterNetworkError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterValidationError,
  OpenRouterModelError,
  OpenRouterTokenLimitError,
  OpenRouterParseError,
  OpenRouterTimeoutError,
  OpenRouterPaymentError,
} from "./openrouter.errors";

/**
 * JSON Schema type definition
 */
interface JSONSchema {
  type: "object" | "array" | "string" | "number" | "boolean";
  properties?: Record<string, unknown>;
  items?: unknown;
  required?: string[];
  additionalProperties?: boolean;
  enum?: unknown[];
  [key: string]: unknown;
}

/**
 * Response format configuration for structured outputs
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: JSONSchema;
  };
}

/**
 * Model parameters for fine-tuning behavior
 */
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Options for creating a chat completion
 */
export interface ChatCompletionOptions<T> {
  systemMessage: string;
  userMessage: string;
  responseFormat: ResponseFormat;
  model?: string;
  modelParams?: ModelParameters;
}

/**
 * Model information
 */
export interface ModelInfo {
  id: string;
  name: string;
  pricing: {
    prompt: number;
    completion: number;
  };
}

/**
 * Internal request payload structure
 */
interface OpenRouterRequestPayload {
  model: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  response_format?: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Internal response structure from OpenRouter API
 */
interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouter Service Class
 *
 * Handles all interactions with the OpenRouter API for LLM completions.
 * Provides type-safe structured responses and comprehensive error handling.
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string = "https://openrouter.ai/api/v1";
  private readonly defaultModel: string;

  /**
   * Initialize the OpenRouter service
   *
   * @param apiKey - OpenRouter API key (required)
   * @param defaultModel - Default model to use for completions (optional)
   */
  constructor(apiKey: string, defaultModel?: string) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel || "x-ai/grok-4.1-fast";
    this.validateApiKey();
  }

  /**
   * Create a chat completion with structured JSON response
   *
   * @param options - Chat completion configuration
   * @returns Parsed and typed response matching the provided schema
   * @throws OpenRouterError or its subclasses on failure
   */
  async createChatCompletion<T>(options: ChatCompletionOptions<T>): Promise<T> {
    this.log("info", "Creating chat completion", {
      model: options.model || this.defaultModel,
      hasSystemMessage: !!options.systemMessage,
      hasUserMessage: !!options.userMessage,
      hasResponseFormat: !!options.responseFormat,
    });

    try {
      const payload = this.buildRequestPayload(options);
      this.log("info", "Request payload built", { model: payload.model });

      const response = await this.makeApiRequest(payload);
      this.log("info", "API request successful", {
        usage: response.usage,
        finishReason: response.choices[0]?.finish_reason,
      });

      const parsed = this.parseStructuredResponse<T>(response);
      this.log("info", "Response parsed successfully");

      return parsed;
    } catch (error) {
      this.log("error", "Chat completion failed", { error });

      if (error instanceof OpenRouterError) {
        throw error;
      }

      throw new OpenRouterError("Unexpected error during chat completion", "UNKNOWN_ERROR", undefined, error);
    }
  }

  /**
   * Validate that the API key is present and properly formatted
   *
   * @throws OpenRouterConfigError if API key is invalid
   */
  private validateApiKey(): void {
    if (!this.apiKey || this.apiKey.trim() === "") {
      throw new OpenRouterConfigError("OpenRouter API key is missing");
    }

    if (!this.apiKey.startsWith("sk-or-")) {
      throw new OpenRouterConfigError("Invalid OpenRouter API key format");
    }
  }

  /**
   * Build the request payload according to OpenRouter API specifications
   *
   * @param options - Chat completion options
   * @returns Formatted request payload
   * @throws OpenRouterValidationError if parameters are out of range
   */
  private buildRequestPayload<T>(options: ChatCompletionOptions<T>): OpenRouterRequestPayload {
    const model = options.model || this.defaultModel;

    const params = {
      temperature: options.modelParams?.temperature ?? 0.7,
      max_tokens: options.modelParams?.max_tokens ?? 1000,
      top_p: options.modelParams?.top_p ?? 1.0,
      frequency_penalty: options.modelParams?.frequency_penalty ?? 0,
      presence_penalty: options.modelParams?.presence_penalty ?? 0,
    };

    // Validate parameters
    if (params.temperature < 0 || params.temperature > 2) {
      throw new OpenRouterValidationError("Temperature must be between 0 and 2");
    }

    if (params.max_tokens <= 0) {
      throw new OpenRouterValidationError("max_tokens must be positive");
    }

    if (params.top_p < 0 || params.top_p > 1) {
      throw new OpenRouterValidationError("top_p must be between 0 and 1");
    }

    if (params.frequency_penalty < -2 || params.frequency_penalty > 2) {
      throw new OpenRouterValidationError("frequency_penalty must be between -2 and 2");
    }

    if (params.presence_penalty < -2 || params.presence_penalty > 2) {
      throw new OpenRouterValidationError("presence_penalty must be between -2 and 2");
    }

    return {
      model,
      messages: [
        {
          role: "system",
          content: options.systemMessage,
        },
        {
          role: "user",
          content: options.userMessage,
        },
      ],
      response_format: options.responseFormat as ResponseFormat,
      ...params,
    };
  }

  /**
   * Make HTTP request to OpenRouter API
   *
   * @param payload - Request payload
   * @returns API response
   * @throws Various OpenRouterError subclasses based on failure type
   */
  private async makeApiRequest(payload: OpenRouterRequestPayload): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://reefmetrics.app",
          "X-Title": "ReefMetrics",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleApiError(response);
      }

      return (await response.json()) as OpenRouterResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === "AbortError") {
        throw new OpenRouterTimeoutError("Request timed out after 30 seconds");
      }

      if (error instanceof OpenRouterError) {
        throw error;
      }

      throw new OpenRouterNetworkError("Failed to connect to OpenRouter API", error);
    }
  }

  /**
   * Handle API errors based on HTTP status code
   *
   * @param response - HTTP response
   * @throws Appropriate OpenRouterError subclass
   */
  private async handleApiError(response: Response): Promise<never> {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = (errorBody as { error?: { message?: string } }).error?.message || response.statusText;

    switch (response.status) {
      case 401:
        throw new OpenRouterAuthError("Authentication failed. Check API key.");
      case 429: {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "60");
        throw new OpenRouterRateLimitError("Rate limit exceeded", retryAfter);
      }
      case 400:
        throw new OpenRouterValidationError(errorMessage, errorBody);
      case 404:
        throw new OpenRouterModelError("Model not found or unavailable", (errorBody as { model?: string }).model);
      case 402:
        throw new OpenRouterPaymentError("Insufficient credits");
      default:
        throw new OpenRouterError(errorMessage, "API_ERROR", response.status, errorBody);
    }
  }

  /**
   * Parse and validate structured response from API
   *
   * @param response - OpenRouter API response
   * @returns Parsed and typed object
   * @throws OpenRouterParseError or OpenRouterTokenLimitError
   */
  private parseStructuredResponse<T>(response: OpenRouterResponse): T {
    // Validate response structure
    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterParseError("No choices in API response", response);
    }

    const choice = response.choices[0];
    const content = choice.message?.content;

    if (!content) {
      throw new OpenRouterParseError("No content in API response", response);
    }

    // Check finish reason
    if (choice.finish_reason === "length") {
      throw new OpenRouterTokenLimitError("Response truncated due to token limit", response.usage?.total_tokens);
    }

    // Parse JSON
    try {
      const parsed = JSON.parse(content) as T;
      return parsed;
    } catch (error) {
      throw new OpenRouterParseError("Failed to parse response JSON", {
        content,
        error,
      });
    }
  }

  /**
   * Log messages for debugging and monitoring
   *
   * @param level - Log level
   * @param message - Log message
   * @param data - Additional data to log
   */
  private log(level: "info" | "warn" | "error", message: string, data?: unknown): void {
    const logEntry: {
      timestamp: string;
      service: string;
      level: string;
      message: string;
      data?: unknown;
    } = {
      timestamp: new Date().toISOString(),
      service: "OpenRouterService",
      level,
      message,
    };

    if (data) {
      logEntry.data = data;
    }

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console[level](JSON.stringify(logEntry, null, 2));
    }
  }
}
