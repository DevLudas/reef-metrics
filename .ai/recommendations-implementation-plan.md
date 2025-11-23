# API Endpoint Implementation Plan: AI Recommendations for Parameter

## 1. Endpoint Overview

This endpoint generates AI-powered recommendations for water parameter deviations in a user's aquarium. When a parameter value falls outside the optimal range, the AI analyzes the situation and provides actionable advice to help the user correct the issue.

**Key Features:**
- Analyzes parameter deviations from optimal ranges
- Generates contextual AI recommendations using OpenRouter.ai
- Provides marine aquarium-specific guidance
- Returns structured, actionable advice

**Business Logic:**
- Only authenticated users can request recommendations
- Users can only get recommendations for their own aquariums
- Recommendations are generated on-demand (not persisted)
- AI context includes aquarium type and parameter specifics

## 2. Request Details

- **HTTP Method**: `POST`
- **URL Structure**: `/api/aquariums/:aquariumId/recommendations`
- **Authentication**: Required (via Supabase session)
- **Content-Type**: `application/json`

### URL Parameters
- **aquariumId** (required): UUID of the aquarium
  - Must be a valid UUID format
  - Must belong to the authenticated user

### Request Body
```typescript
{
  parameter_id: string;      // UUID of the parameter (e.g., Ca, Mg, kH)
  current_value: number;     // Current measured value
  optimal_min: number;       // Minimum optimal value for this parameter
  optimal_max: number;       // Maximum optimal value for this parameter
}
```

### Validation Rules
- All fields are required
- `parameter_id` must be a valid UUID
- `current_value` must be a positive number
- `optimal_min` must be a positive number
- `optimal_max` must be a positive number
- `optimal_max` must be greater than `optimal_min`

## 3. Used Types

### Command Model
```typescript
// Already defined in types.ts
interface GetRecommendationsCommand {
  parameter_id: string;
  current_value: number;
  optimal_min: number;
  optimal_max: number;
}
```

### Response DTOs
```typescript
// Already defined in types.ts
interface RecommendationDTO {
  parameter: {
    id: string;
    name: string;
    full_name: string;
    unit: string;
  };
  current_value: number;
  optimal_range: {
    min: number;
    max: number;
  };
  deviation_percentage: number;
  status: 'normal' | 'warning' | 'critical';
  analysis: string;
  recommendations: string[];
  disclaimer: string;
}

type RecommendationResponseDTO = ApiResponseDTO<RecommendationDTO>;
```

### Internal Types
```typescript
// For AI service
interface AIRecommendationContext {
  aquariumType: string;
  parameterName: string;
  parameterFullName: string;
  parameterUnit: string;
  currentValue: number;
  optimalMin: number;
  optimalMax: number;
  deviationPercentage: number;
  status: 'warning' | 'critical';
}

interface AIRecommendationResponse {
  analysis: string;
  recommendations: string[];
}
```

## 4. Response Details

### Success Response (200 OK)
```json
{
  "data": {
    "parameter": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Ca",
      "full_name": "Calcium",
      "unit": "ppm"
    },
    "current_value": 350,
    "optimal_range": {
      "min": 400,
      "max": 450
    },
    "deviation_percentage": -12.5,
    "status": "warning",
    "analysis": "Your calcium level is currently below the optimal range...",
    "recommendations": [
      "Test your alkalinity (kH) before adjusting calcium",
      "Consider using a calcium reactor or two-part dosing system",
      "Monitor daily and adjust slowly to avoid shocking corals"
    ],
    "disclaimer": "These recommendations are AI-generated and should be used as guidance only. Always research and verify before making changes to your aquarium."
  }
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this aquarium"
  }
}
```

**404 Not Found**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Aquarium not found"
  }
}
```

**400 Bad Request**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "optimal_max",
        "message": "optimal_max must be greater than optimal_min"
      }
    ]
  }
}
```

**503 Service Unavailable**
```json
{
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "AI recommendation service is temporarily unavailable. Please try again later."
  }
}
```

## 5. Data Flow

### Request Flow
1. **Authentication** (Middleware)
   - Verify user session via Supabase
   - Attach user to `context.locals`

2. **Input Validation**
   - Validate `aquariumId` UUID format
   - Validate request body with Zod schema

3. **Authorization Check**
   - Query aquarium from database
   - Verify `aquarium.user_id === authenticated_user.id`
   - Return 403 if mismatch
   - Return 404 if aquarium doesn't exist

4. **Parameter Validation**
   - Query parameter from database
   - Verify parameter exists
   - Return 404 if not found

5. **AI Generation** (if not normal)
   - Prepare context with aquarium type and parameter details
   - Call OpenRouter.ai API
   - Parse AI response into structured format
   - Apply safety filters/validation

6. **Response Construction**
   - Build `RecommendationDTO` with all data
   - Add standard disclaimer
   - Return wrapped response

### Database Queries
```typescript
// 1. Get aquarium with type
const aquarium = await supabase
  .from('aquariums')
  .select('id, user_id, aquarium_type:aquarium_types(name)')
  .eq('id', aquariumId)
  .single();

// 2. Get parameter details
const parameter = await supabase
  .from('parameters')
  .select('id, name, full_name, unit')
  .eq('id', parameter_id)
  .single();
```

### External API Call
```typescript
// OpenRouter.ai API
POST https://openrouter.ai/api/v1/chat/completions
Headers:
  Authorization: Bearer ${OPENROUTER_API_KEY}
  Content-Type: application/json

Body:
{
  "model": "x-ai/grok-4.1-fast",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert marine aquarium advisor..."
    },
    {
      "role": "user",
      "content": "Analyze this parameter deviation and provide recommendations..."
    }
  ]
}
```

## 6. Security Considerations

### Authentication & Authorization
- **Session Validation**: Middleware validates Supabase session before endpoint execution
- **Ownership Verification**: Explicit check that `aquarium.user_id` matches authenticated user
- **RLS Policies**: Database RLS policies provide defense-in-depth (though explicit checks are still needed)

### Input Validation
- **UUID Validation**: All IDs validated as proper UUID format to prevent injection
- **Numeric Validation**: All numeric values validated as positive numbers
- **Range Validation**: Ensure `optimal_max > optimal_min` to prevent logic errors
- **Schema Validation**: Use Zod for comprehensive input validation

### AI Security
- **Prompt Injection Prevention**: 
  - Sanitize all user-provided values before including in AI prompts
  - Use structured prompts with clear boundaries
  - Parameter values are numeric only (not free text)
- **Response Validation**: Validate AI response structure before returning to client
- **Rate Limiting**: Consider implementing rate limiting per user to prevent abuse
- **Cost Control**: Monitor OpenRouter.ai usage to prevent excessive costs

### Data Privacy
- **Minimal Data Sharing**: Only share necessary context with AI service (no user emails, IDs, etc.)
- **No Persistence**: Recommendations are not stored, reducing data exposure risk
- **Error Messages**: Generic error messages to avoid leaking system information

### CORS & Headers
- Proper CORS configuration for API endpoints
- Security headers (CSP, X-Frame-Options, etc.)

## 7. Error Handling

### Error Categories

#### 1. Authentication Errors (401)
**Scenario**: No valid session or expired token
```typescript
if (!user) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    }),
    { status: 401 }
  );
}
```

#### 2. Authorization Errors (403)
**Scenario**: User doesn't own the aquarium
```typescript
if (aquarium.user_id !== user.id) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this aquarium'
      }
    }),
    { status: 403 }
  );
}
```

#### 3. Not Found Errors (404)
**Scenarios**:
- Aquarium doesn't exist
- Parameter doesn't exist

```typescript
if (!aquarium) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'NOT_FOUND',
        message: 'Aquarium not found'
      }
    }),
    { status: 404 }
  );
}
```

#### 4. Validation Errors (400)
**Scenarios**:
- Invalid UUID format
- Missing required fields
- Invalid numeric values
- `optimal_max <= optimal_min`

```typescript
const validationResult = schema.safeParse(data);
if (!validationResult.success) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }
    }),
    { status: 400 }
  );
}
```

#### 5. AI Service Errors (503)
**Scenarios**:
- OpenRouter.ai API timeout
- OpenRouter.ai API error response
- Network failures

```typescript
try {
  const aiResponse = await callAIService(context);
} catch (error) {
  console.error('AI service error:', error);
  return new Response(
    JSON.stringify({
      error: {
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI recommendation service is temporarily unavailable. Please try again later.'
      }
    }),
    { status: 503 }
  );
}
```

#### 6. Internal Server Errors (500)
**Scenarios**: Unexpected errors
```typescript
try {
  // ... endpoint logic
} catch (error) {
  console.error('Unexpected error:', error);
  return new Response(
    JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }),
    { status: 500 }
  );
}
```

### Error Logging Strategy
- Log all errors with appropriate severity levels
- Include request context (user_id, aquarium_id) for debugging
- Never log sensitive data (tokens, passwords)
- Use structured logging for easier analysis

## 8. Performance Considerations

### Potential Bottlenecks
1. **AI API Latency**: OpenRouter.ai calls can take 2-5 seconds
2. **Database Queries**: Multiple sequential queries can add latency
3. **Network Overhead**: External API dependency introduces variability

### Optimization Strategies

#### 1. Database Query Optimization
- Use single query with joins to fetch aquarium + type
- Leverage existing indexes
- Consider caching parameter data (rarely changes)

#### 2. AI Service Optimization
- Set reasonable timeout (10-15 seconds)
- Use streaming responses if supported
- Consider fallback recommendations for common scenarios
- Cache similar recommendations (future enhancement)

#### 3. Response Time Management
- Target total response time: < 8 seconds (including AI)
- Set AI API timeout: 10 seconds
- Database queries: < 100ms each
- Total processing: < 200ms

#### 4. Resource Management
- Implement connection pooling for database
- Reuse HTTP connections for AI API
- Consider request queuing if needed

#### 5. Monitoring
- Track AI API response times
- Monitor success/failure rates
- Alert on degraded performance
- Track costs per request

### Scalability Considerations
- AI API calls don't scale linearly with users
- Consider implementing request queue for high load
- Monitor OpenRouter.ai rate limits
- Implement circuit breaker pattern for AI service failures

## 9. Implementation Steps

### Step 1: Create Validation Schema
**File**: `src/lib/validation/recommendation.validation.ts`
```typescript
import { z } from 'zod';

export const getRecommendationsSchema = z.object({
  parameter_id: z.string().uuid('Parameter ID must be a valid UUID'),
  current_value: z.number().positive('Current value must be positive'),
  optimal_min: z.number().positive('Optimal minimum must be positive'),
  optimal_max: z.number().positive('Optimal maximum must be positive')
}).refine(
  (data) => data.optimal_max > data.optimal_min,
  {
    message: 'Optimal maximum must be greater than optimal minimum',
    path: ['optimal_max']
  }
);
```

### Step 2: Create AI Service
**File**: `src/lib/services/ai-recommendations.service.ts`

Implement the following functions:
- `calculateDeviation(current: number, min: number, max: number): number`
- `determineStatus(deviationPercentage: number): ParameterStatus`
- `generateRecommendations(context: AIRecommendationContext): Promise<AIRecommendationResponse>`
- `callOpenRouter(prompt: string): Promise<string>`

Key responsibilities:
- Calculate deviation percentage from optimal range midpoint
- Determine status based on deviation thresholds
- Construct AI prompts with aquarium context
- Call OpenRouter.ai API
- Parse and validate AI responses
- Handle AI service errors gracefully

### Step 3: Update Environment Variables
**File**: `.env`
```bash
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

### Step 4: Create API Endpoint
**File**: `src/pages/api/aquariums/[aquariumId]/recommendations.ts`

Implementation order:
1. Export `prerender = false`
2. Implement `POST` handler
3. Extract user from `context.locals`
4. Validate authentication
5. Parse and validate request body
6. Validate `aquariumId` format
7. Query aquarium with type
8. Verify ownership
9. Query parameter details
10. Calculate deviation and status
11. Generate AI recommendations (if needed)
12. Construct response
13. Handle all error cases

### Step 5: Add Error Handling
- Wrap all operations in try-catch
- Implement specific error handlers for each scenario
- Return appropriate status codes and messages
- Log errors with context

### Step 6: Add AI Prompt Engineering
Design the system and user prompts:
- **System prompt**: Define AI role as marine aquarium expert
- **User prompt**: Include parameter context, deviation, aquarium type
- **Output format**: Request structured JSON with analysis + recommendations
- **Safety instructions**: Request practical, safe advice only

Example prompt structure:
```
System: You are an expert marine aquarium advisor specializing in water chemistry...

User: Analyze the following parameter deviation for a {aquariumType} aquarium:
- Parameter: {parameterFullName} ({parameterName})
- Current Value: {currentValue} {unit}
- Optimal Range: {optimalMin}-{optimalMax} {unit}
- Deviation: {deviationPercentage}%
- Status: {status}

Provide a brief analysis and 3-5 specific, actionable recommendations...
```

### Step 7: Testing
Create test cases for:
- ✅ Successful recommendation generation
- ✅ Normal values (no recommendations needed)
- ✅ Warning threshold (10-25% deviation)
- ✅ Critical threshold (>25% deviation)
- ❌ Unauthorized access (no session)
- ❌ Forbidden access (wrong user)
- ❌ Aquarium not found
- ❌ Parameter not found
- ❌ Invalid request body
- ❌ AI service failure
- ❌ Invalid UUID format

### Step 8: Documentation
- Document AI prompt design decisions
- Document deviation thresholds rationale
- Add JSDoc comments to all functions
- Update API documentation
- Add usage examples

### Step 9: Monitoring Setup
- Add logging for AI API calls
- Track response times
- Monitor success/failure rates
- Set up alerts for high failure rates
- Track AI API costs

### Step 10: Security Review
- Review all input validation
- Test authorization checks
- Review AI prompt injection scenarios
- Test rate limiting (if implemented)
- Review error message information leakage

## 10. Additional Considerations

### Disclaimer Text
Standard disclaimer for all AI recommendations:
```
"These recommendations are AI-generated and should be used as guidance only. Always research and verify before making changes to your aquarium. Consult with experienced aquarists or professionals for critical situations."
```

### Future Enhancements
- Cache similar recommendations for common scenarios
- Add user feedback mechanism for recommendation quality
- Implement rate limiting per user
- Add support for multiple languages
- Store recommendation history (if users want it)
- Add explanation of status thresholds to users
- Implement A/B testing for different AI models

### Dependencies
- OpenRouter.ai account and API key
- Supabase connection
- Environment variables configured
- Zod validation library
- Existing services: `aquarium.service.ts`, `reference-data.service.ts`

### Related Endpoints
- `GET /api/aquariums/:id/dashboard` - Shows current parameter status
- `POST /api/measurements/:aquariumId` - Users act on recommendations by adding measurements
- `GET /api/parameters` - Lists available parameters

---

**Implementation Priority**: High (Core MVP feature)
**Estimated Complexity**: Medium-High (External API integration + AI)
**Estimated Time**: 8-12 hours (including testing and prompt engineering)

