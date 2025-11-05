# API Endpoint Implementation Plan: Create Aquarium

## 1. Endpoint Overview

This endpoint allows authenticated users to create a new aquarium by providing its name, type, and optional metadata (description and volume). The endpoint ensures data validation, enforces unique aquarium names per user, and validates that the specified aquarium type exists before creation.

**Purpose**: Enable users to add new aquariums to their account for tracking water parameters.

**Key Features**:
- User authentication required
- Automatic user_id assignment from authenticated session
- Unique aquarium name enforcement per user
- Aquarium type validation
- Optional metadata support (description, volume)

## 2. Request Details

- **HTTP Method**: `POST`
- **URL Structure**: `/api/aquariums`
- **Authentication**: Required (JWT token via Supabase Auth)
- **Content-Type**: `application/json`

### Parameters

#### Required:
- `name` (string): User-defined aquarium name, minimum 1 character
- `aquarium_type_id` (UUID string): Reference to a valid aquarium type

#### Optional:
- `description` (string): Aquarium description or notes
- `volume` (number): Tank volume in liters, must be positive if provided

### Request Body Example:
```json
{
  "name": "My Reef Tank",
  "aquarium_type_id": "123e4567-e89b-12d3-a456-426614174000",
  "description": "75 gallon mixed reef",
  "volume": 284
}
```

## 3. Used Types

### Command Model (Input Validation):
```typescript
// From src/types.ts
interface CreateAquariumCommand {
  name: string;
  aquarium_type_id: string;
  description?: string;
  volume?: number;
}
```

### Response DTO:
```typescript
// From src/types.ts
type CreateAquariumResponseDTO = ApiResponseDTO<Omit<AquariumDTO, "aquarium_type"> & { aquarium_type?: never }>;

// Which expands to:
interface CreateAquariumResponseDTO {
  data: {
    id: string;
    user_id: string;
    aquarium_type_id: string;
    name: string;
    description: string | null;
    volume: number | null;
    created_at: string;
    updated_at: string;
  }
}
```

### Database Types:
```typescript
// From src/types.ts
type AquariumInsert = Tables["aquariums"]["Insert"];
type AquariumEntity = Tables["aquariums"]["Row"];
```

### Error Response:
```typescript
// From src/types.ts
interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: string | ValidationErrorDetail[];
  };
}
```

## 4. Response Details

### Success Response (201 Created):
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "user_id": "user-uuid-here",
    "aquarium_type_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "My Reef Tank",
    "description": "75 gallon mixed reef",
    "volume": 284,
    "created_at": "2025-11-02T12:00:00Z",
    "updated_at": "2025-11-02T12:00:00Z"
  }
}
```

### Error Responses:

#### 401 Unauthorized:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 400 Bad Request (Validation Error):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "name",
        "message": "Name is required and must not be empty"
      },
      {
        "field": "volume",
        "message": "Volume must be a positive number"
      }
    ]
  }
}
```

#### 404 Not Found (Invalid Aquarium Type):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Aquarium type not found"
  }
}
```

#### 409 Conflict (Duplicate Name):
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "An aquarium with this name already exists"
  }
}
```

#### 500 Internal Server Error:
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

### Step-by-Step Flow:

1. **Request Reception**: API endpoint receives POST request with JSON payload
2. **Authentication Check**: Verify user is authenticated via `context.locals.supabase.auth.getUser()`
3. **Input Validation**: Validate request body against Zod schema
4. **Aquarium Type Validation**: Query database to ensure aquarium_type_id exists
5. **Data Preparation**: Construct AquariumInsert object with user_id from auth context
6. **Database Insertion**: Insert aquarium record into database
   - RLS policies automatically enforce user_id match
   - Unique constraint (user_id, name) prevents duplicates
7. **Response Formatting**: Return created aquarium with 201 status
8. **Error Handling**: Catch and handle specific error types at each step

### Database Interactions:

```typescript
// 1. Validate aquarium type exists
const { data: aquariumType } = await supabase
  .from('aquarium_types')
  .select('id')
  .eq('id', aquarium_type_id)
  .single();

// 2. Insert new aquarium
const { data: aquarium } = await supabase
  .from('aquariums')
  .insert({
    user_id,
    name,
    aquarium_type_id,
    description,
    volume
  })
  .select()
  .single();
```

### Service Layer Responsibility:
The `AquariumService.createAquarium()` method should:
- Accept validated CreateAquariumCommand and user_id
- Validate aquarium type exists
- Insert aquarium record
- Handle database-specific errors (unique constraint, foreign key)
- Return created AquariumEntity or throw appropriate errors

## 6. Security Considerations

### Authentication:
- **Requirement**: User must be authenticated before accessing endpoint
- **Implementation**: Check `context.locals.supabase.auth.getUser()` at endpoint start
- **Error**: Return 401 if user not authenticated

### Authorization:
- **User Isolation**: RLS policies ensure users can only create aquariums for themselves
- **Implementation**: Use authenticated user's ID from auth context, never from request body
- **Database Level**: RLS policy checks `auth.uid() = user_id` on INSERT

### Data Validation:
- **Input Sanitization**: Zod schema validates all input data types and constraints
- **SQL Injection**: Protected by Supabase parameterized queries
- **XSS Prevention**: No HTML rendering of user input in this endpoint

### Rate Limiting:
- **Consideration**: Implement rate limiting at middleware level (future enhancement)
- **Current**: Rely on Supabase built-in protections

### Foreign Key Validation:
- **Security**: Prevent insertion of aquariums with non-existent types
- **Implementation**: Explicitly validate aquarium_type_id exists before insertion
- **Reason**: Provides better error messages and prevents database errors

## 7. Error Handling

### Authentication Errors (401):
**Scenario**: User not authenticated
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return new Response(JSON.stringify({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    }
  }), { status: 401 });
}
```

### Validation Errors (400):
**Scenario**: Invalid input data
```typescript
const validation = createAquariumSchema.safeParse(await request.json());
if (!validation.success) {
  return new Response(JSON.stringify({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    }
  }), { status: 400 });
}
```

### Not Found Errors (404):
**Scenario**: Aquarium type doesn't exist
```typescript
const { data: aquariumType, error: typeError } = await supabase
  .from('aquarium_types')
  .select('id')
  .eq('id', aquarium_type_id)
  .single();

if (typeError || !aquariumType) {
  return new Response(JSON.stringify({
    error: {
      code: 'NOT_FOUND',
      message: 'Aquarium type not found'
    }
  }), { status: 404 });
}
```

### Conflict Errors (409):
**Scenario**: Duplicate aquarium name for user
```typescript
// Supabase error code for unique constraint violation
if (error?.code === '23505') {
  return new Response(JSON.stringify({
    error: {
      code: 'CONFLICT',
      message: 'An aquarium with this name already exists'
    }
  }), { status: 409 });
}
```

### Server Errors (500):
**Scenario**: Unexpected database or server errors
```typescript
catch (error) {
  console.error('Error creating aquarium:', error);
  return new Response(JSON.stringify({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  }), { status: 500 });
}
```

### Error Logging:
- Log all errors to console with context
- Include user_id (sanitized) and request details
- For production: integrate with error tracking service (e.g., Sentry)

## 8. Performance Considerations

### Database Queries:
- **Aquarium Type Validation**: Single SELECT query with indexed lookup (primary key)
- **Aquarium Insertion**: Single INSERT query
- **Total Queries**: 2 database round trips

### Optimization Strategies:
1. **Index Usage**: 
   - Primary key index on `aquarium_types.id` (automatic)
   - Composite unique index on `aquariums(user_id, name)` (from schema)
   - Index on `aquariums.user_id` for RLS policy evaluation

2. **Query Optimization**:
   - Use `.single()` for aquarium type lookup to reduce data transfer
   - Use `.select()` after insert to get created record in one operation
   - Avoid unnecessary joins (aquarium_type not needed in response)

3. **Connection Pooling**: Leveraged by Supabase client

4. **Caching Opportunities**:
   - Aquarium types rarely change - could cache in memory/Redis
   - Not critical for MVP but consider for scale

### Expected Performance:
- **Response Time**: < 200ms under normal load
- **Bottlenecks**: None expected for MVP scale
- **Scalability**: RLS policies add minimal overhead; Supabase handles scaling

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema
**File**: `src/pages/api/aquariums/index.ts`

```typescript
import { z } from 'zod';

const createAquariumSchema = z.object({
  name: z.string().min(1, 'Name is required and must not be empty'),
  aquarium_type_id: z.string().uuid('Invalid aquarium type ID format'),
  description: z.string().optional(),
  volume: z.number().positive('Volume must be a positive number').optional()
});
```

### Step 2: Create Aquarium Service
**File**: `src/lib/services/aquarium.service.ts`

```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type { CreateAquariumCommand, AquariumEntity } from '@/types';

export class AquariumService {
  constructor(private supabase: SupabaseClient) {}

  async createAquarium(
    userId: string,
    command: CreateAquariumCommand
  ): Promise<AquariumEntity> {
    // Validate aquarium type exists
    const { data: aquariumType, error: typeError } = await this.supabase
      .from('aquarium_types')
      .select('id')
      .eq('id', command.aquarium_type_id)
      .single();

    if (typeError || !aquariumType) {
      throw new Error('AQUARIUM_TYPE_NOT_FOUND');
    }

    // Insert aquarium
    const { data: aquarium, error: insertError } = await this.supabase
      .from('aquariums')
      .insert({
        user_id: userId,
        name: command.name,
        aquarium_type_id: command.aquarium_type_id,
        description: command.description,
        volume: command.volume
      })
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation
      if (insertError.code === '23505') {
        throw new Error('DUPLICATE_AQUARIUM_NAME');
      }
      throw insertError;
    }

    return aquarium;
  }
}
```

### Step 3: Create API Endpoint
**File**: `src/pages/api/aquariums/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { AquariumService } from '@/lib/services/aquarium.service';
import type { CreateAquariumCommand, CreateAquariumResponseDTO, ErrorResponseDTO } from '@/types';

export const prerender = false;

const createAquariumSchema = z.object({
  name: z.string().min(1, 'Name is required and must not be empty'),
  aquarium_type_id: z.string().uuid('Invalid aquarium type ID format'),
  description: z.string().optional(),
  volume: z.number().positive('Volume must be a positive number').optional()
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authenticate user
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      } as ErrorResponseDTO), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validation = createAquariumSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      } as ErrorResponseDTO), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const command: CreateAquariumCommand = validation.data;

    // Step 3: Create aquarium via service
    const aquariumService = new AquariumService(locals.supabase);
    const aquarium = await aquariumService.createAquarium(user.id, command);

    // Step 4: Return success response
    return new Response(JSON.stringify({
      data: aquarium
    } as CreateAquariumResponseDTO), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Handle service-level errors
    if (error instanceof Error) {
      if (error.message === 'AQUARIUM_TYPE_NOT_FOUND') {
        return new Response(JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: 'Aquarium type not found'
          }
        } as ErrorResponseDTO), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (error.message === 'DUPLICATE_AQUARIUM_NAME') {
        return new Response(JSON.stringify({
          error: {
            code: 'CONFLICT',
            message: 'An aquarium with this name already exists'
          }
        } as ErrorResponseDTO), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Log unexpected errors
    console.error('Error creating aquarium:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    } as ErrorResponseDTO), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Step 4: Test Authentication
- Test with valid authenticated user
- Test with unauthenticated request (401)
- Test with expired token (401)

### Step 5: Test Input Validation
- Test with missing required fields (400)
- Test with invalid UUID format (400)
- Test with negative volume (400)
- Test with empty name (400)
- Test with all valid inputs (201)

### Step 6: Test Business Logic
- Test creating aquarium with valid type (201)
- Test creating aquarium with non-existent type (404)
- Test creating duplicate aquarium name for same user (409)
- Test creating aquarium with same name for different user (201 - should succeed)

### Step 7: Test Response Format
- Verify 201 status code on success
- Verify response includes all expected fields
- Verify timestamps are in correct format
- Verify error responses match specified format

### Step 8: Integration Testing
- Test end-to-end flow from request to database
- Verify RLS policies enforce user isolation
- Verify unique constraints work correctly
- Test with concurrent requests

### Step 9: Performance Testing
- Measure response time under normal load
- Verify database query count (should be 2)
- Check for N+1 query problems (none expected)

### Step 10: Documentation
- Document endpoint in API documentation
- Add JSDoc comments to service methods
- Update README with example usage
- Document error codes and meanings

## 10. Testing Checklist

### Unit Tests:
- [ ] Validation schema correctly validates valid input
- [ ] Validation schema rejects invalid input (missing fields, wrong types)
- [ ] Service creates aquarium with valid data
- [ ] Service throws error for non-existent aquarium type
- [ ] Service throws error for duplicate name

### Integration Tests:
- [ ] POST /api/aquariums returns 401 without authentication
- [ ] POST /api/aquariums returns 400 for invalid data
- [ ] POST /api/aquariums returns 404 for invalid aquarium type
- [ ] POST /api/aquariums returns 409 for duplicate name
- [ ] POST /api/aquariums returns 201 with valid data
- [ ] Created aquarium has correct user_id
- [ ] RLS prevents creating aquarium for different user

### Edge Cases:
- [ ] Name with special characters
- [ ] Very long name (within TEXT limits)
- [ ] Volume at boundary values (0.01, very large)
- [ ] Description with special characters/emojis
- [ ] Concurrent requests with same name

## 11. Dependencies

### Required Packages:
- `zod` - Input validation (already in project)
- `@supabase/supabase-js` - Database client (already in project)

### Database Requirements:
- `aquariums` table with RLS policies enabled
- `aquarium_types` table pre-populated
- Unique constraint on `(user_id, name)`
- Foreign key constraint on `aquarium_type_id`

### Environment Variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## 12. Future Enhancements

### Potential Improvements:
1. **Batch Creation**: Support creating multiple aquariums in one request
2. **Image Upload**: Allow users to upload aquarium photos
3. **Templates**: Pre-fill description/volume based on aquarium type
4. **Validation**: Add business rules (e.g., max aquariums per user)
5. **Audit Trail**: Log aquarium creation events
6. **Webhooks**: Notify external systems of new aquariums
7. **Rate Limiting**: Prevent abuse with per-user rate limits

### Monitoring:
- Track creation success/failure rates
- Monitor average response times
- Alert on increased 409 errors (may indicate UX issues)
- Track most popular aquarium types

