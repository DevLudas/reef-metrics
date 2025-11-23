# OpenRouter Service Implementation Plan

## 1. Service Description

The OpenRouter Service is a TypeScript service class that provides an abstraction layer for interacting with the OpenRouter API. OpenRouter is a unified interface for accessing multiple Large Language Model (LLM) providers through a single API. This service will enable the ReefMetrics application to leverage AI capabilities for analyzing aquarium water parameters and providing intelligent recommendations to users.

### Purpose
- Facilitate communication with various LLM models through the OpenRouter API
- Provide type-safe, structured responses using JSON schemas
- Handle error scenarios gracefully and provide meaningful error messages
- Abstract API complexity and provide a clean interface for the application
- Support configurable model selection and parameter tuning

### Key Responsibilities
- Construct properly formatted chat completion requests
- Manage system and user messages
- Define and enforce structured response formats using JSON schemas
- Handle API authentication and rate limiting
- Process and validate API responses
- Provide comprehensive error handling

## 2. Constructor Description

### Constructor Signature
```typescript
constructor(private apiKey: string, private defaultModel?: string)
```

### Parameters
1. **apiKey** (required): The OpenRouter API key for authentication
   - Type: `string`
   - Should be loaded from environment variables (`import.meta.env.OPENROUTER_API_KEY`)
   - Must be kept secure and never exposed to client-side code

2. **defaultModel** (optional): Default model to use for completions
   - Type: `string`
   - Example values: `"anthropic/claude-3.5-sonnet"`, `"openai/gpt-4-turbo"`
   - Can be overridden per request
   - Default: `"anthropic/claude-3.5-sonnet"` (recommended for ReefMetrics use case)

### Initialization
The constructor should:
- Store the API key securely in a private field
- Set the default model or use a sensible fallback
- Initialize the base URL for OpenRouter API: `https://openrouter.ai/api/v1`
- Optionally validate that the API key is present (throw error if missing)

### Example Usage
```typescript
const openRouterService = new OpenRouterService(
  import.meta.env.OPENROUTER_API_KEY,
  "anthropic/claude-3.5-sonnet"
);
```

## 3. Public Methods and Fields

### 3.1 Primary Method: `createChatCompletion`

This is the main public method for generating chat completions with structured responses.

#### Method Signature
```typescript
async createChatCompletion<T>(
  options: ChatCompletionOptions<T>
): Promise<T>
```

#### Parameters
The method accepts a single options object with the following properties:

1. **systemMessage** (required)
   - Type: `string`
   - Purpose: Defines the AI's role, behavior, and context
   - Example for ReefMetrics:
     ```typescript
     systemMessage: `You are an expert marine biologist and aquarium specialist. 
     Your role is to analyze water parameter measurements from reef aquariums 
     and provide actionable recommendations. Focus on coral health, fish welfare, 
     and long-term tank stability. Provide specific, practical advice.`
     ```

2. **userMessage** (required)
   - Type: `string`
   - Purpose: The actual query or prompt from the user/application
   - Example for ReefMetrics:
     ```typescript
     userMessage: `Analyze these water parameters for a 100L reef aquarium:
     - pH: 7.9
     - Salinity: 1.024
     - Temperature: 26°C
     - Nitrate: 25 ppm
     - Phosphate: 0.15 ppm
     Provide assessment and recommendations.`
     ```

3. **responseFormat** (required)
   - Type: `ResponseFormat<T>`
   - Purpose: Defines the structured JSON schema for the response
   - Must follow OpenRouter's response_format specification
   - Structure:
     ```typescript
     responseFormat: {
       type: 'json_schema',
       json_schema: {
         name: string,        // Schema name (e.g., "aquarium_analysis")
         strict: true,        // Always true for structured outputs
         schema: {            // JSON Schema object
           type: 'object',
           properties: { ... },
           required: [...],
           additionalProperties: false
         }
       }
     }
     ```
   - Example for ReefMetrics:
     ```typescript
     responseFormat: {
       type: 'json_schema',
       json_schema: {
         name: 'aquarium_parameter_analysis',
         strict: true,
         schema: {
           type: 'object',
           properties: {
             overall_status: {
               type: 'string',
               enum: ['healthy', 'warning', 'critical']
             },
             parameter_assessments: {
               type: 'array',
               items: {
                 type: 'object',
                 properties: {
                   parameter_name: { type: 'string' },
                   status: { 
                     type: 'string',
                     enum: ['optimal', 'acceptable', 'concerning', 'dangerous']
                   },
                   current_value: { type: 'number' },
                   optimal_range: { type: 'string' },
                   impact: { type: 'string' }
                 },
                 required: ['parameter_name', 'status', 'current_value', 'optimal_range', 'impact'],
                 additionalProperties: false
               }
             },
             recommendations: {
               type: 'array',
               items: {
                 type: 'object',
                 properties: {
                   priority: { 
                     type: 'string',
                     enum: ['high', 'medium', 'low']
                   },
                   action: { type: 'string' },
                   explanation: { type: 'string' }
                 },
                 required: ['priority', 'action', 'explanation'],
                 additionalProperties: false
               }
             }
           },
           required: ['overall_status', 'parameter_assessments', 'recommendations'],
           additionalProperties: false
         }
       }
     }
     ```

4. **model** (optional)
   - Type: `string`
   - Purpose: Override the default model for this specific request
   - Example: `"openai/gpt-4o"`, `"google/gemini-pro-1.5"`

5. **modelParams** (optional)
   - Type: `ModelParameters`
   - Purpose: Fine-tune model behavior
   - Properties:
     - `temperature` (number, 0-2): Controls randomness (lower = more focused, higher = more creative)
       - Default: `0.7`
       - ReefMetrics recommendation: `0.3` (more consistent, factual responses)
     - `max_tokens` (number): Maximum tokens in the response
       - Default: `1000`
       - ReefMetrics recommendation: `2000` (allow detailed analysis)
     - `top_p` (number, 0-1): Nucleus sampling threshold
       - Default: `1.0`
       - ReefMetrics recommendation: `0.9`
     - `frequency_penalty` (number, -2 to 2): Reduce repetition
       - Default: `0`
     - `presence_penalty` (number, -2 to 2): Encourage topic diversity
       - Default: `0`

#### Return Value
- Returns a `Promise<T>` where `T` is the TypeScript type matching the response schema
- The response is parsed and validated against the provided schema
- Throws an error if the response doesn't match the expected format

#### Example Usage
```typescript
interface AquariumAnalysis {
  overall_status: 'healthy' | 'warning' | 'critical';
  parameter_assessments: Array<{
    parameter_name: string;
    status: 'optimal' | 'acceptable' | 'concerning' | 'dangerous';
    current_value: number;
    optimal_range: string;
    impact: string;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    explanation: string;
  }>;
}

const analysis = await openRouterService.createChatCompletion<AquariumAnalysis>({
  systemMessage: 'You are an expert marine biologist...',
  userMessage: 'Analyze these parameters...',
  responseFormat: {
    type: 'json_schema',
    json_schema: {
      name: 'aquarium_parameter_analysis',
      strict: true,
      schema: { /* schema definition */ }
    }
  },
  modelParams: {
    temperature: 0.3,
    max_tokens: 2000
  }
});

console.log(analysis.overall_status);
console.log(analysis.recommendations);
```

### 3.2 Utility Method: `listAvailableModels` (Optional)

```typescript
async listAvailableModels(): Promise<ModelInfo[]>
```

Returns a list of available models from OpenRouter. Useful for debugging or allowing model selection.

### 3.3 Public Type Definitions

Export these types for use throughout the application:

```typescript
export interface ChatCompletionOptions<T> {
  systemMessage: string;
  userMessage: string;
  responseFormat: ResponseFormat<T>;
  model?: string;
  modelParams?: ModelParameters;
}

export interface ResponseFormat<T> {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: true;
    schema: JSONSchema;
  };
}

export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  pricing: {
    prompt: number;
    completion: number;
  };
}
```

## 4. Private Methods and Fields

### 4.1 Private Fields

```typescript
private readonly apiKey: string;
private readonly baseUrl: string = 'https://openrouter.ai/api/v1';
private readonly defaultModel: string;
```

### 4.2 Private Method: `buildRequestPayload`

```typescript
private buildRequestPayload<T>(options: ChatCompletionOptions<T>): OpenRouterRequestPayload
```

**Purpose**: Construct the request payload according to OpenRouter API specifications.

**Implementation Details**:
- Combine system and user messages into the messages array
- Apply model selection (use provided model or default)
- Merge default and provided model parameters
- Structure the response_format according to OpenRouter requirements
- Add required headers and metadata

**Payload Structure**:
```typescript
{
  model: string,
  messages: [
    {
      role: 'system',
      content: systemMessage
    },
    {
      role: 'user',
      content: userMessage
    }
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: string,
      strict: true,
      schema: JSONSchema
    }
  },
  temperature: number,
  max_tokens: number,
  top_p: number,
  frequency_penalty: number,
  presence_penalty: number
}
```

### 4.3 Private Method: `makeApiRequest`

```typescript
private async makeApiRequest(payload: OpenRouterRequestPayload): Promise<OpenRouterResponse>
```

**Purpose**: Execute the HTTP request to OpenRouter API.

**Implementation Details**:
- Use `fetch` API to make POST request to `${baseUrl}/chat/completions`
- Set required headers:
  - `Authorization: Bearer ${apiKey}`
  - `Content-Type: application/json`
  - `HTTP-Referer: https://reefmetrics.app` (optional, for OpenRouter analytics)
  - `X-Title: ReefMetrics` (optional, for OpenRouter analytics)
- Handle network errors
- Parse JSON response
- Check for API-level errors in response

**Example Implementation**:
```typescript
const response = await fetch(`${this.baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://reefmetrics.app',
    'X-Title': 'ReefMetrics'
  },
  body: JSON.stringify(payload)
});

if (!response.ok) {
  throw new Error(`OpenRouter API error: ${response.status}`);
}

return await response.json();
```

### 4.4 Private Method: `parseStructuredResponse`

```typescript
private parseStructuredResponse<T>(response: OpenRouterResponse): T
```

**Purpose**: Extract and parse the structured JSON response from the API response.

**Implementation Details**:
- Extract the content from `response.choices[0].message.content`
- Parse the JSON string
- Validate that it matches the expected schema structure
- Handle parsing errors
- Return typed object

**Example Implementation**:
```typescript
const content = response.choices[0]?.message?.content;

if (!content) {
  throw new Error('No content in OpenRouter response');
}

try {
  return JSON.parse(content) as T;
} catch (error) {
  throw new Error(`Failed to parse OpenRouter response: ${error}`);
}
```

### 4.5 Private Method: `validateApiKey`

```typescript
private validateApiKey(): void
```

**Purpose**: Ensure API key is present and valid format.

**Implementation Details**:
- Check if API key exists
- Optionally verify it starts with expected prefix
- Throw descriptive error if invalid

### 4.6 Private Type Definitions

```typescript
private interface OpenRouterRequestPayload {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  response_format?: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict: true;
      schema: JSONSchema;
    };
  };
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

private interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

## 5. Error Handling

### 5.1 Error Scenarios

The service must handle the following error scenarios:

1. **Missing or Invalid API Key**
   - Scenario: API key not provided or invalid format
   - Detection: During initialization or first API call
   - Action: Throw `OpenRouterConfigError` with message "OpenRouter API key is missing or invalid"
   - User Impact: Configuration issue, needs developer attention

2. **Network Errors**
   - Scenario: Network timeout, DNS failure, connection refused
   - Detection: `fetch` throws error
   - Action: Throw `OpenRouterNetworkError` with message "Failed to connect to OpenRouter API"
   - User Impact: Temporary issue, implement retry logic

3. **Authentication Errors (401)**
   - Scenario: Invalid API key or expired credentials
   - Detection: HTTP 401 response
   - Action: Throw `OpenRouterAuthError` with message "OpenRouter authentication failed. Check API key."
   - User Impact: Configuration issue, needs API key update

4. **Rate Limiting (429)**
   - Scenario: Too many requests in short period
   - Detection: HTTP 429 response
   - Action: Throw `OpenRouterRateLimitError` with retry-after information
   - User Impact: Temporary issue, implement exponential backoff
   - Recovery: Include `retryAfter` timestamp in error

5. **Invalid Request (400)**
   - Scenario: Malformed request, invalid parameters, or schema errors
   - Detection: HTTP 400 response
   - Action: Throw `OpenRouterValidationError` with detailed error from API
   - User Impact: Code issue, needs debugging
   - Include: API error details for troubleshooting

6. **Model Not Available (404/503)**
   - Scenario: Requested model doesn't exist or is temporarily unavailable
   - Detection: HTTP 404 or 503 response
   - Action: Throw `OpenRouterModelError` with model name and suggestion
   - User Impact: Configuration issue or temporary outage
   - Recovery: Fallback to default model if available

7. **Token Limit Exceeded**
   - Scenario: Request or response exceeds token limits
   - Detection: API error message or finish_reason: "length"
   - Action: Throw `OpenRouterTokenLimitError` with token count info
   - User Impact: Input too large, needs truncation or model change

8. **Response Parsing Errors**
   - Scenario: API returns invalid JSON or structure doesn't match schema
   - Detection: JSON.parse() throws or schema validation fails
   - Action: Throw `OpenRouterParseError` with original response
   - User Impact: API issue or schema mismatch, needs investigation

9. **Timeout Errors**
   - Scenario: Request takes too long (>30 seconds)
   - Detection: AbortSignal timeout
   - Action: Throw `OpenRouterTimeoutError`
   - User Impact: Model too slow or complex request
   - Recovery: Retry with simplified prompt or different model

10. **Insufficient Credits (402)**
    - Scenario: Account has no remaining credits
    - Detection: HTTP 402 response
    - Action: Throw `OpenRouterPaymentError`
    - User Impact: Billing issue, needs account top-up

### 5.2 Error Class Hierarchy

Create custom error classes for better error handling:

```typescript
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export class OpenRouterConfigError extends OpenRouterError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'OpenRouterConfigError';
  }
}

export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', undefined, details);
    this.name = 'OpenRouterNetworkError';
  }
}

export class OpenRouterAuthError extends OpenRouterError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'OpenRouterAuthError';
  }
}

export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'OpenRouterRateLimitError';
  }
}

export class OpenRouterValidationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'OpenRouterValidationError';
  }
}

export class OpenRouterModelError extends OpenRouterError {
  constructor(
    message: string,
    public modelName: string
  ) {
    super(message, 'MODEL_ERROR', 404);
    this.name = 'OpenRouterModelError';
  }
}

export class OpenRouterTokenLimitError extends OpenRouterError {
  constructor(
    message: string,
    public tokenCount?: number
  ) {
    super(message, 'TOKEN_LIMIT_ERROR');
    this.name = 'OpenRouterTokenLimitError';
  }
}

export class OpenRouterParseError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, 'PARSE_ERROR', undefined, details);
    this.name = 'OpenRouterParseError';
  }
}

export class OpenRouterTimeoutError extends OpenRouterError {
  constructor(message: string) {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'OpenRouterTimeoutError';
  }
}

export class OpenRouterPaymentError extends OpenRouterError {
  constructor(message: string) {
    super(message, 'PAYMENT_ERROR', 402);
    this.name = 'OpenRouterPaymentError';
  }
}
```

### 5.3 Error Handling Pattern

Implement error handling in the main method:

```typescript
async createChatCompletion<T>(options: ChatCompletionOptions<T>): Promise<T> {
  try {
    this.validateApiKey();
    const payload = this.buildRequestPayload(options);
    const response = await this.makeApiRequest(payload);
    return this.parseStructuredResponse<T>(response);
  } catch (error) {
    // Re-throw custom errors
    if (error instanceof OpenRouterError) {
      throw error;
    }
    
    // Wrap unknown errors
    throw new OpenRouterError(
      'Unexpected error during chat completion',
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }
}
```

### 5.4 Logging Strategy

Implement comprehensive logging:

```typescript
private log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'OpenRouterService',
    level,
    message,
    ...(data && { data })
  };
  
  // In development: console log
  if (import.meta.env.DEV) {
    console[level](logEntry);
  }
  
  // In production: send to logging service (future implementation)
  // logToService(logEntry);
}
```

Use logging throughout the service:
- Log all API requests (without sensitive data)
- Log all API responses (without full content)
- Log all errors with full context
- Log rate limit events
- Log token usage for monitoring

## 6. Security Considerations

### 6.1 API Key Protection

1. **Environment Variables**
   - Store API key in `.env` file: `OPENROUTER_API_KEY=sk-or-...`
   - Never commit `.env` to version control (ensure in `.gitignore`)
   - Use Astro's `import.meta.env` to access securely
   - Only access on server side, never expose to client

2. **Server-Side Only**
   - Service must only be instantiated in server contexts:
     - Astro API routes (`src/pages/api/**/*.ts`)
     - Astro middleware (`src/middleware/index.ts`)
     - Server-side services (`src/lib/services/**/*.ts`)
   - Never import or use in client-side React components
   - Mark API endpoints with `export const prerender = false`

3. **Key Rotation**
   - Support easy API key rotation without code changes
   - Document key rotation procedure
   - Monitor for unauthorized key usage

### 6.2 Input Sanitization

1. **Message Validation**
   - Validate and sanitize user messages before sending to API
   - Implement maximum length limits (e.g., 10,000 characters)
   - Strip or escape potentially harmful content
   - Use Zod schemas for validation

2. **Schema Validation**
   - Validate JSON schemas before sending to API
   - Ensure schemas are properly structured
   - Prevent injection of malicious schemas

3. **Parameter Bounds**
   - Enforce valid ranges for model parameters:
     - `temperature`: 0-2
     - `max_tokens`: 1-8000 (model dependent)
     - `top_p`: 0-1
   - Throw validation errors for out-of-range values

### 6.3 Rate Limiting and Abuse Prevention

1. **Request Throttling**
   - Implement client-side rate limiting
   - Track requests per minute/hour
   - Reject requests exceeding limits
   - Return appropriate error messages

2. **Cost Controls**
   - Monitor token usage per request
   - Set maximum tokens per request
   - Log usage for cost tracking
   - Alert on unusual usage patterns

3. **User Quotas** (Future Enhancement)
   - Implement per-user request limits
   - Track usage by user ID
   - Prevent abuse by individual users

### 6.4 Response Validation

1. **Schema Enforcement**
   - Strictly validate API responses against expected schema
   - Reject responses that don't match schema
   - Prevent injection of unexpected data

2. **Content Filtering**
   - Monitor for inappropriate or harmful content in responses
   - Implement content moderation if needed
   - Log suspicious responses

### 6.5 HTTPS and Transport Security

1. **Secure Communication**
   - Always use HTTPS for API requests (enforced by baseUrl)
   - Validate SSL certificates
   - Implement timeout for hanging connections

2. **Data in Transit**
   - All data encrypted via TLS
   - No sensitive data in URLs (use POST body)

### 6.6 Error Message Security

1. **Information Disclosure**
   - Don't expose API keys in error messages
   - Don't reveal internal system details
   - Use generic error messages for users
   - Log detailed errors server-side only

2. **Error Handling**
   - Never return raw API responses to client
   - Sanitize error messages before sending to frontend
   - Implement error codes instead of detailed messages

## 7. Step-by-Step Implementation Plan

### Phase 1: Project Setup and Environment Configuration

**Step 1.1: Install Required Dependencies**
```bash
# No additional packages needed - use native fetch API
# Zod is already installed in the project
```

**Step 1.2: Set Up Environment Variables**
1. Add to `.env` file:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
   OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
   ```
2. Add to `.env.example` (without actual key):
   ```
   OPENROUTER_API_KEY=
   OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
   ```
3. Verify `.env` is in `.gitignore`

**Step 1.3: Update Type Definitions**
1. Open `src/types.ts`
2. Add OpenRouter-specific types at the end of the file

**Estimated Time**: 15 minutes

---

### Phase 2: Create Error Classes

**Step 2.1: Create Error Module**
1. Create file: `src/lib/services/openrouter.errors.ts`
2. Implement base `OpenRouterError` class
3. Implement all specific error classes (10 total)
4. Export all error classes

**Step 2.2: Test Error Classes**
1. Create simple test to ensure errors can be thrown and caught
2. Verify error properties (code, statusCode, etc.)

**Estimated Time**: 30 minutes

---

### Phase 3: Implement Service Core Structure

**Step 3.1: Create Service File**
1. Create file: `src/lib/services/openrouter.service.ts`
2. Import required dependencies:
   - Error classes from `openrouter.errors.ts`
   - Type definitions from `@/types`

**Step 3.2: Define Service Class Structure**
1. Define private fields:
   ```typescript
   private readonly apiKey: string;
   private readonly baseUrl: string = 'https://openrouter.ai/api/v1';
   private readonly defaultModel: string;
   ```
2. Implement constructor:
   ```typescript
   constructor(apiKey: string, defaultModel?: string) {
     this.apiKey = apiKey;
     this.defaultModel = defaultModel || 'anthropic/claude-3.5-sonnet';
     this.validateApiKey();
   }
   ```

**Step 3.3: Implement Validation Method**
1. Implement `validateApiKey()`:
   ```typescript
   private validateApiKey(): void {
     if (!this.apiKey || this.apiKey.trim() === '') {
       throw new OpenRouterConfigError('OpenRouter API key is missing');
     }
     
     if (!this.apiKey.startsWith('sk-or-')) {
       throw new OpenRouterConfigError('Invalid OpenRouter API key format');
     }
   }
   ```

**Estimated Time**: 20 minutes

---

### Phase 4: Implement Request Building

**Step 4.1: Define Request Types**
1. Add private interfaces for request/response structures
2. Include all required fields according to OpenRouter API spec

**Step 4.2: Implement `buildRequestPayload` Method**
1. Create method signature
2. Merge system and user messages
3. Add model selection logic
4. Apply model parameters with defaults
5. Structure response_format properly
6. Return complete payload object

**Step 4.3: Add Parameter Validation**
1. Validate temperature range (0-2)
2. Validate max_tokens (positive number)
3. Validate top_p range (0-1)
4. Throw `OpenRouterValidationError` for invalid parameters

**Example Implementation**:
```typescript
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
    throw new OpenRouterValidationError('Temperature must be between 0 and 2');
  }
  
  return {
    model,
    messages: [
      {
        role: 'system',
        content: options.systemMessage
      },
      {
        role: 'user',
        content: options.userMessage
      }
    ],
    response_format: options.responseFormat,
    ...params
  };
}
```

**Estimated Time**: 45 minutes

---

### Phase 5: Implement API Communication

**Step 5.1: Implement `makeApiRequest` Method**
1. Set up fetch request with proper headers
2. Add Authorization header with API key
3. Add Content-Type and optional referer headers
4. Handle network errors
5. Check HTTP status codes
6. Parse JSON response

**Step 5.2: Add Error Mapping**
1. Map HTTP status codes to custom errors:
   - 401 → `OpenRouterAuthError`
   - 429 → `OpenRouterRateLimitError`
   - 400 → `OpenRouterValidationError`
   - 404 → `OpenRouterModelError`
   - 402 → `OpenRouterPaymentError`
   - Other → `OpenRouterError`

**Step 5.3: Add Timeout Handling**
1. Create AbortController with timeout
2. Set timeout to 30 seconds
3. Throw `OpenRouterTimeoutError` on timeout

**Example Implementation**:
```typescript
private async makeApiRequest(payload: OpenRouterRequestPayload): Promise<OpenRouterResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://reefmetrics.app',
        'X-Title': 'ReefMetrics'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      await this.handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new OpenRouterTimeoutError('Request timed out after 30 seconds');
    }
    
    if (error instanceof OpenRouterError) {
      throw error;
    }
    
    throw new OpenRouterNetworkError('Failed to connect to OpenRouter API', error);
  }
}
```

**Step 5.4: Implement Error Handler**
```typescript
private async handleApiError(response: Response): Promise<never> {
  const errorBody = await response.json().catch(() => ({}));
  const errorMessage = errorBody.error?.message || response.statusText;
  
  switch (response.status) {
    case 401:
      throw new OpenRouterAuthError('Authentication failed. Check API key.');
    case 429:
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      throw new OpenRouterRateLimitError('Rate limit exceeded', retryAfter);
    case 400:
      throw new OpenRouterValidationError(errorMessage, errorBody);
    case 404:
      throw new OpenRouterModelError('Model not found or unavailable', errorBody.model);
    case 402:
      throw new OpenRouterPaymentError('Insufficient credits');
    default:
      throw new OpenRouterError(errorMessage, 'API_ERROR', response.status, errorBody);
  }
}
```

**Estimated Time**: 60 minutes

---

### Phase 6: Implement Response Parsing

**Step 6.1: Implement `parseStructuredResponse` Method**
1. Extract content from response
2. Validate response structure
3. Parse JSON content
4. Handle parsing errors
5. Return typed object

**Step 6.2: Add Response Validation**
1. Check for empty responses
2. Validate JSON structure
3. Check finish_reason for issues
4. Handle token limit errors

**Example Implementation**:
```typescript
private parseStructuredResponse<T>(response: OpenRouterResponse): T {
  // Validate response structure
  if (!response.choices || response.choices.length === 0) {
    throw new OpenRouterParseError('No choices in API response', response);
  }
  
  const choice = response.choices[0];
  const content = choice.message?.content;
  
  if (!content) {
    throw new OpenRouterParseError('No content in API response', response);
  }
  
  // Check finish reason
  if (choice.finish_reason === 'length') {
    throw new OpenRouterTokenLimitError(
      'Response truncated due to token limit',
      response.usage?.total_tokens
    );
  }
  
  // Parse JSON
  try {
    const parsed = JSON.parse(content) as T;
    return parsed;
  } catch (error) {
    throw new OpenRouterParseError(
      'Failed to parse response JSON',
      { content, error }
    );
  }
}
```

**Estimated Time**: 30 minutes

---

### Phase 7: Implement Main Public Method

**Step 7.1: Implement `createChatCompletion` Method**
1. Create method signature with generic type
2. Call validation
3. Build request payload
4. Make API request
5. Parse response
6. Handle all errors
7. Add logging

**Example Implementation**:
```typescript
async createChatCompletion<T>(options: ChatCompletionOptions<T>): Promise<T> {
  this.log('info', 'Creating chat completion', {
    model: options.model || this.defaultModel,
    hasSystemMessage: !!options.systemMessage,
    hasUserMessage: !!options.userMessage,
    hasResponseFormat: !!options.responseFormat
  });
  
  try {
    const payload = this.buildRequestPayload(options);
    this.log('info', 'Request payload built', { model: payload.model });
    
    const response = await this.makeApiRequest(payload);
    this.log('info', 'API request successful', {
      usage: response.usage,
      finishReason: response.choices[0]?.finish_reason
    });
    
    const parsed = this.parseStructuredResponse<T>(response);
    this.log('info', 'Response parsed successfully');
    
    return parsed;
  } catch (error) {
    this.log('error', 'Chat completion failed', { error });
    
    if (error instanceof OpenRouterError) {
      throw error;
    }
    
    throw new OpenRouterError(
      'Unexpected error during chat completion',
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }
}
```

**Step 7.2: Implement Logging Method**
```typescript
private log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'OpenRouterService',
    level,
    message,
    ...(data && { data })
  };
  
  if (import.meta.env.DEV) {
    console[level](JSON.stringify(logEntry, null, 2));
  }
}
```

**Estimated Time**: 30 minutes

---

### Phase 8: Testing and Validation

**Step 8.1: Create Test Endpoint**
1. Create `src/pages/api/test/openrouter.ts`
2. Implement simple test endpoint
3. Test with basic request

**Example Test Endpoint**:
```typescript
import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/lib/services/openrouter.service';
import { errorResponse } from '@/lib/utils';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const service = new OpenRouterService(
      import.meta.env.OPENROUTER_API_KEY,
      import.meta.env.OPENROUTER_DEFAULT_MODEL
    );
    
    const result = await service.createChatCompletion({
      systemMessage: 'You are a helpful assistant.',
      userMessage: 'Say hello in JSON format.',
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'greeting',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            },
            required: ['message'],
            additionalProperties: false
          }
        }
      }
    });
    
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (error instanceof OpenRouterError) {
      return errorResponse(
        error.code as any,
        error.message,
        error.statusCode || 500
      );
    }
    
    return errorResponse('INTERNAL_SERVER_ERROR', 'Test failed', 500);
  }
};
```

**Step 8.2: Manual Testing**
1. Test with valid request → Should succeed
2. Test with invalid API key → Should throw `OpenRouterAuthError`
3. Test with invalid schema → Should throw `OpenRouterValidationError`
4. Test with unsupported model → Should throw `OpenRouterModelError`
5. Test with very long message → Should handle gracefully

**Step 8.3: Integration Testing**
1. Create a real aquarium analysis request
2. Verify response matches schema
3. Test error handling
4. Verify logging works

**Estimated Time**: 90 minutes

---

### Phase 9: Documentation and Code Review

**Step 9.1: Add JSDoc Comments**
1. Document all public methods
2. Document all public types
3. Add usage examples
4. Document error scenarios

**Step 9.2: Create Usage Examples**
1. Create example in service file comments
2. Document common patterns
3. Show error handling examples

**Step 9.3: Update Project Documentation**
1. Add service to README if applicable
2. Document environment variables
3. Add troubleshooting guide

**Estimated Time**: 45 minutes

---

### Phase 10: Production Readiness

**Step 10.1: Security Audit**
1. Verify API key is never exposed
2. Check all error messages don't leak sensitive data
3. Verify all inputs are validated
4. Review logging for sensitive data

**Step 10.2: Performance Optimization**
1. Review timeout settings
2. Consider adding retry logic for transient failures
3. Optimize payload size

**Step 10.3: Monitoring Setup**
1. Add metrics for request count
2. Track token usage
3. Monitor error rates
4. Set up alerts for API failures

**Step 10.4: Rate Limiting Implementation** (Optional for MVP)
1. Implement simple in-memory rate limiter
2. Track requests per user
3. Return appropriate errors

**Estimated Time**: 60 minutes

---

### Total Estimated Implementation Time

- Phase 1: 15 minutes
- Phase 2: 30 minutes
- Phase 3: 20 minutes
- Phase 4: 45 minutes
- Phase 5: 60 minutes
- Phase 6: 30 minutes
- Phase 7: 30 minutes
- Phase 8: 90 minutes
- Phase 9: 45 minutes
- Phase 10: 60 minutes

**Total: ~7 hours** (for a focused, experienced developer)

---

## Implementation Checklist

### Core Implementation
- [ ] Environment variables configured
- [ ] Error classes created and tested
- [ ] Service class structure implemented
- [ ] Constructor and validation implemented
- [ ] Request payload builder implemented
- [ ] API communication layer implemented
- [ ] Response parser implemented
- [ ] Main public method implemented
- [ ] Logging system implemented

### Testing
- [ ] Test endpoint created
- [ ] Manual testing completed
- [ ] Error scenarios tested
- [ ] Integration with ReefMetrics tested
- [ ] Edge cases handled

### Documentation
- [ ] JSDoc comments added
- [ ] Usage examples created
- [ ] Environment variables documented
- [ ] Error handling documented
- [ ] Troubleshooting guide created

### Production Readiness
- [ ] Security audit completed
- [ ] API key protection verified
- [ ] Error messages sanitized
- [ ] Logging configured
- [ ] Performance optimized
- [ ] Monitoring setup (optional)
- [ ] Rate limiting implemented (optional)

### Code Quality
- [ ] ESLint passes with no errors
- [ ] Code follows project style guide
- [ ] TypeScript types are strict
- [ ] No console.logs in production code (use logging method)
- [ ] All edge cases handled

---

## Future Enhancements

### Planned Improvements
1. **Retry Logic**: Implement exponential backoff for transient failures
2. **Caching**: Cache responses for identical requests (with TTL)
3. **Streaming Support**: Add support for streaming responses
4. **Multi-turn Conversations**: Support conversation history
5. **Cost Tracking**: Detailed token usage and cost analytics
6. **Model Comparison**: A/B test different models
7. **Batch Requests**: Process multiple requests in parallel
8. **Response Caching**: Cache common analyses
9. **Fallback Models**: Automatic fallback to alternative models
10. **Usage Analytics**: Dashboard for API usage patterns

### Nice-to-Have Features
- Model selection UI for admin users
- Prompt template management
- Response quality feedback loop
- Custom model fine-tuning integration
- Multi-language support
- Voice input/output integration

---

## Appendix: Example Integration with ReefMetrics

### Creating an AI Analysis Service

Create `src/lib/services/aquarium-ai.service.ts`:

```typescript
import { OpenRouterService } from './openrouter.service';
import type { ParameterStatusViewModel } from '@/types';

export interface AquariumAIAnalysis {
  overall_status: 'healthy' | 'warning' | 'critical';
  summary: string;
  parameter_assessments: Array<{
    parameter_name: string;
    status: 'optimal' | 'acceptable' | 'concerning' | 'dangerous';
    current_value: number;
    optimal_range: string;
    impact: string;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    explanation: string;
    estimated_time: string;
  }>;
  risk_factors: string[];
}

export class AquariumAIService {
  private openRouter: OpenRouterService;
  
  constructor() {
    this.openRouter = new OpenRouterService(
      import.meta.env.OPENROUTER_API_KEY,
      'anthropic/claude-3.5-sonnet'
    );
  }
  
  async analyzeParameters(
    parameters: ParameterStatusViewModel[],
    aquariumType: string,
    volume?: number
  ): Promise<AquariumAIAnalysis> {
    const systemMessage = `You are an expert marine biologist and reef aquarium specialist with over 20 years of experience.
Your role is to analyze water parameter measurements and provide actionable recommendations.
Focus on coral health, fish welfare, and long-term tank stability.
Provide specific, practical advice that hobbyists can implement.
Consider the interplay between different parameters.`;

    const userMessage = this.buildAnalysisPrompt(parameters, aquariumType, volume);
    
    const responseFormat = {
      type: 'json_schema' as const,
      json_schema: {
        name: 'aquarium_parameter_analysis',
        strict: true as const,
        schema: {
          type: 'object' as const,
          properties: {
            overall_status: {
              type: 'string' as const,
              enum: ['healthy', 'warning', 'critical']
            },
            summary: { type: 'string' as const },
            parameter_assessments: {
              type: 'array' as const,
              items: {
                type: 'object' as const,
                properties: {
                  parameter_name: { type: 'string' as const },
                  status: {
                    type: 'string' as const,
                    enum: ['optimal', 'acceptable', 'concerning', 'dangerous']
                  },
                  current_value: { type: 'number' as const },
                  optimal_range: { type: 'string' as const },
                  impact: { type: 'string' as const }
                },
                required: ['parameter_name', 'status', 'current_value', 'optimal_range', 'impact'],
                additionalProperties: false
              }
            },
            recommendations: {
              type: 'array' as const,
              items: {
                type: 'object' as const,
                properties: {
                  priority: {
                    type: 'string' as const,
                    enum: ['high', 'medium', 'low']
                  },
                  action: { type: 'string' as const },
                  explanation: { type: 'string' as const },
                  estimated_time: { type: 'string' as const }
                },
                required: ['priority', 'action', 'explanation', 'estimated_time'],
                additionalProperties: false
              }
            },
            risk_factors: {
              type: 'array' as const,
              items: { type: 'string' as const }
            }
          },
          required: ['overall_status', 'summary', 'parameter_assessments', 'recommendations', 'risk_factors'],
          additionalProperties: false
        }
      }
    };
    
    return await this.openRouter.createChatCompletion<AquariumAIAnalysis>({
      systemMessage,
      userMessage,
      responseFormat,
      modelParams: {
        temperature: 0.3,
        max_tokens: 3000
      }
    });
  }
  
  private buildAnalysisPrompt(
    parameters: ParameterStatusViewModel[],
    aquariumType: string,
    volume?: number
  ): string {
    let prompt = `Analyze the following water parameters for a ${aquariumType} aquarium`;
    
    if (volume) {
      prompt += ` with a volume of ${volume}L`;
    }
    
    prompt += ':\n\n';
    
    for (const param of parameters) {
      prompt += `- ${param.parameter_name}: ${param.current_value} ${param.unit}`;
      if (param.optimal_min !== null && param.optimal_max !== null) {
        prompt += ` (optimal: ${param.optimal_min}-${param.optimal_max} ${param.unit})`;
      }
      prompt += `\n`;
    }
    
    prompt += `\nProvide a comprehensive analysis including:
1. Overall tank health status
2. Assessment of each parameter
3. Prioritized recommendations for correction
4. Potential risk factors to monitor`;
    
    return prompt;
  }
}
```

### Creating an API Endpoint

Create `src/pages/api/ai/analyze-parameters.ts`:

```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { AquariumAIService } from '@/lib/services/aquarium-ai.service';
import { errorResponse } from '@/lib/utils';
import { OpenRouterError } from '@/lib/services/openrouter.errors';

export const prerender = false;

const requestSchema = z.object({
  aquarium_id: z.string().uuid(),
  parameters: z.array(z.object({
    parameter_name: z.string(),
    current_value: z.number(),
    unit: z.string(),
    optimal_min: z.number().nullable(),
    optimal_max: z.number().nullable()
  })),
  aquarium_type: z.string(),
  volume: z.number().optional()
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Validate request
    const body = await request.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid request', 400);
    }
    
    const { parameters, aquarium_type, volume } = validation.data;
    
    // Call AI service
    const aiService = new AquariumAIService();
    const analysis = await aiService.analyzeParameters(parameters, aquarium_type, volume);
    
    return new Response(
      JSON.stringify({ data: analysis }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    if (error instanceof OpenRouterError) {
      // Map OpenRouter errors to API errors
      return errorResponse(
        'INTERNAL_SERVER_ERROR',
        'AI analysis failed. Please try again later.',
        500
      );
    }
    
    return errorResponse('INTERNAL_SERVER_ERROR', 'Unexpected error', 500);
  }
};
```

This comprehensive implementation plan provides all the necessary details for implementing the OpenRouter service in the ReefMetrics application following the project's architecture patterns and best practices.

