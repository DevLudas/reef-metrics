# API Endpoint Implementation Plan: Aquariums CRUD Operations

## 1. Endpoint Overview

This plan covers the implementation of four REST API endpoints for managing aquariums in the ReefMetrics application:

1. **List User's Aquariums** - Retrieve all aquariums belonging to the authenticated user with optional sorting
2. **Get Single Aquarium** - Retrieve detailed information about a specific aquarium
3. **Update Aquarium** - Modify an existing aquarium's properties
4. **Delete Aquarium** - Remove an aquarium and all its associated measurements

These endpoints form the core CRUD operations for aquarium management and enforce strict ownership validation to ensure users can only access their own data.

## 2. Request Details

### 2.1 List User's Aquariums

- **HTTP Method**: `GET`
- **URL Structure**: `/api/aquariums`
- **Parameters**:
  - Optional query parameters:
    - `sort`: Sort field (allowed values: `name`, `created_at`) - default: `created_at`
    - `order`: Sort order (allowed values: `asc`, `desc`) - default: `desc`
- **Request Body**: None
- **Authentication**: Required (user must be authenticated)

### 2.2 Get Single Aquarium

- **HTTP Method**: `GET`
- **URL Structure**: `/api/aquariums/:id`
- **Parameters**:
  - Required URL parameter:
    - `id`: UUID of the aquarium
- **Request Body**: None
- **Authentication**: Required (user must be authenticated and own the aquarium)

### 2.3 Update Aquarium

- **HTTP Method**: `PATCH`
- **URL Structure**: `/api/aquariums/:id`
- **Parameters**:
  - Required URL parameter:
    - `id`: UUID of the aquarium
- **Request Body** (all fields optional):
```json
{
  "name": "string (min 1 char)",
  "aquarium_type_id": "uuid",
  "description": "string",
  "volume": "number (positive)"
}
```
- **Authentication**: Required (user must be authenticated and own the aquarium)

### 2.4 Delete Aquarium

- **HTTP Method**: `DELETE`
- **URL Structure**: `/api/aquariums/:id`
- **Parameters**:
  - Required URL parameter:
    - `id`: UUID of the aquarium
- **Request Body**: None
- **Authentication**: Required (user must be authenticated and own the aquarium)

## 3. Used Types

### DTOs (from types.ts)

```typescript
// List endpoint
AquariumListItemDTO
AquariumsListResponseDTO

// Single item endpoint
AquariumDTO
AquariumResponseDTO

// Update endpoint
UpdateAquariumCommand
UpdateAquariumResponseDTO

// Error responses (all endpoints)
ErrorResponseDTO
ValidationErrorDetail
```

### Validation Schemas (to be created with Zod)

```typescript
// Query parameters validation for GET /api/aquariums
listAquariumsQuerySchema = z.object({
  sort: z.enum(['name', 'created_at']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
})

// URL parameter validation (all endpoints with :id)
uuidParamSchema = z.string().uuid()

// Update command validation for PATCH /api/aquariums/:id
updateAquariumSchema = z.object({
  name: z.string().min(1).optional(),
  aquarium_type_id: z.string().uuid().optional(),
  description: z.string().optional(),
  volume: z.number().positive().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
})
```

## 4. Response Details

### 4.1 List User's Aquariums

**Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "aquarium_type_id": "uuid",
      "name": "string",
      "description": "string | null",
      "volume": "number | null",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "aquarium_type": {
        "id": "uuid",
        "name": "string"
      }
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `400 Bad Request`: Invalid query parameters (invalid sort field or order)

### 4.2 Get Single Aquarium

**Success Response (200 OK)**:
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "aquarium_type_id": "uuid",
    "name": "string",
    "description": "string | null",
    "volume": "number | null",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "aquarium_type": {
      "id": "uuid",
      "name": "string",
      "description": "string | null"
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Aquarium belongs to another user
- `404 Not Found`: Aquarium not found
- `400 Bad Request`: Invalid UUID format

### 4.3 Update Aquarium

**Success Response (200 OK)**:
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "aquarium_type_id": "uuid",
    "name": "string",
    "description": "string | null",
    "volume": "number | null",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Aquarium belongs to another user
- `404 Not Found`: Aquarium not found
- `400 Bad Request`: Invalid data or validation error, invalid UUID format, no fields provided
- `409 Conflict`: Aquarium with this name already exists for the user

### 4.4 Delete Aquarium

**Success Response (204 No Content)**: Empty response body

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Aquarium belongs to another user
- `404 Not Found`: Aquarium not found
- `400 Bad Request`: Invalid UUID format

## 5. Data Flow

### 5.1 List User's Aquariums Flow

1. Extract and validate query parameters (`sort`, `order`)
2. Get authenticated user ID from `locals.supabase` or use `DEFAULT_USER_ID`
3. Call `AquariumService.listAquariums(userId, sort, order)`
4. Service queries `aquariums` table with:
   - Filter: `user_id = userId`
   - Join: `aquarium_types` table (select id, name only)
   - Order: Based on sort and order parameters
5. Return array of aquariums with nested aquarium_type data
6. Format response as `AquariumsListResponseDTO`

### 5.2 Get Single Aquarium Flow

1. Extract and validate `id` from URL parameters
2. Get authenticated user ID
3. Call `AquariumService.getAquarium(userId, aquariumId)`
4. Service queries `aquariums` table with:
   - Filter: `id = aquariumId`
   - Join: `aquarium_types` table (select id, name, description)
5. Check ownership: If aquarium exists but `user_id != userId`, throw `FORBIDDEN` error
6. If aquarium not found, throw `NOT_FOUND` error
7. Return aquarium with nested aquarium_type data
8. Format response as `AquariumResponseDTO`

### 5.3 Update Aquarium Flow

1. Extract and validate `id` from URL parameters
2. Parse and validate request body against `updateAquariumSchema`
3. Get authenticated user ID
4. Call `AquariumService.updateAquarium(userId, aquariumId, command)`
5. Service verifies ownership by querying aquarium with user_id filter
6. If `aquarium_type_id` is being updated, verify it exists in `aquarium_types` table
7. Perform update with Supabase `.update()` method
8. Handle unique constraint violation (duplicate name) with 409 error
9. Return updated aquarium (without nested aquarium_type in response)
10. Format response as `UpdateAquariumResponseDTO`

### 5.4 Delete Aquarium Flow

1. Extract and validate `id` from URL parameters
2. Get authenticated user ID
3. Call `AquariumService.deleteAquarium(userId, aquariumId)`
4. Service verifies ownership by querying aquarium with user_id filter
5. If aquarium found and owned, delete with Supabase `.delete()` method
6. Database cascade delete automatically removes all associated measurements
7. Return 204 No Content (empty response)

## 6. Security Considerations

### 6.1 Authentication

- All endpoints require authentication (currently using `DEFAULT_USER_ID` placeholder)
- Future implementation: Extract user ID from `locals.supabase.auth.getUser()`
- Return 401 Unauthorized if user is not authenticated

### 6.2 Authorization (Ownership Validation)

**Critical**: All endpoints must verify aquarium ownership to prevent IDOR attacks

- **Service-level checks**: Every service method must filter by `user_id` when querying
- **Forbidden vs Not Found**: Return 403 when aquarium exists but belongs to another user, 404 when it doesn't exist
- **RLS enforcement**: Rely on Supabase RLS policies as a secondary defense layer

### 6.3 Input Validation

- **UUID validation**: Use Zod `.uuid()` validator for all ID parameters
- **Query parameter validation**: Whitelist allowed values for `sort` and `order`
- **Request body validation**: Validate all fields against Zod schemas
- **Sanitization**: Supabase handles SQL injection prevention via parameterized queries

### 6.4 Data Exposure

- **List endpoint**: Only return minimal aquarium_type data (id, name)
- **Get endpoint**: Return full aquarium_type data (id, name, description)
- **Update endpoint**: Don't include aquarium_type in response (client can refetch if needed)
- **Never expose**: Other users' data, internal system fields

### 6.5 Rate Limiting

- Consider implementing rate limiting for all endpoints (not in MVP)
- Especially important for list and create operations

## 7. Error Handling

### 7.1 Validation Errors (400 Bad Request)

**Trigger**: Invalid input data, query parameters, or UUID format

```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: [
      {
        field: "name",
        message: "Name is required and must not be empty"
      }
    ]
  }
}
```

### 7.2 Authentication Errors (401 Unauthorized)

**Trigger**: User not authenticated

```typescript
{
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required"
  }
}
```

### 7.3 Authorization Errors (403 Forbidden)

**Trigger**: User attempts to access aquarium they don't own

```typescript
{
  error: {
    code: "FORBIDDEN",
    message: "You do not have permission to access this aquarium"
  }
}
```

### 7.4 Not Found Errors (404 Not Found)

**Trigger**: Aquarium doesn't exist or aquarium_type doesn't exist

```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Aquarium not found"
  }
}
```

### 7.5 Conflict Errors (409 Conflict)

**Trigger**: Duplicate aquarium name for the same user

```typescript
{
  error: {
    code: "CONFLICT",
    message: "An aquarium with this name already exists"
  }
}
```

### 7.6 Internal Server Errors (500 Internal Server Error)

**Trigger**: Unexpected database or service errors

```typescript
{
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred"
  }
}
```

**Logging**: Use `console.error()` to log full error details for debugging

## 8. Performance Considerations

### 8.1 Database Optimization

- **Indexes**: Leverage existing `idx_aquariums_user` index for user filtering
- **Select specific fields**: Use `.select()` to fetch only needed columns
- **Efficient joins**: Use Supabase's single query joins for aquarium_type data
- **Avoid N+1 queries**: Fetch aquarium_type data in same query using join syntax

### 8.2 Query Performance

- **List endpoint**: Limit results if list grows large (consider pagination in future)
- **Sorting**: Use database-level sorting (ORDER BY) rather than application-level
- **Caching**: Consider caching aquarium_types data (reference table, rarely changes)

### 8.3 Response Size

- **Minimize payload**: Return only necessary fields in nested objects
- **Compression**: Enable gzip compression for responses (server-level configuration)

## 9. Implementation Steps

### Step 1: Extend AquariumService with New Methods

**File**: `src/lib/services/aquarium.service.ts`

Add the following methods to the existing `AquariumService` class:

```typescript
async listAquariums(
  userId: string,
  sort: 'name' | 'created_at' = 'created_at',
  order: 'asc' | 'desc' = 'desc'
): Promise<AquariumListItemDTO[]>

async getAquarium(
  userId: string,
  aquariumId: string
): Promise<AquariumDTO>

async updateAquarium(
  userId: string,
  aquariumId: string,
  command: UpdateAquariumCommand
): Promise<AquariumEntity>

async deleteAquarium(
  userId: string,
  aquariumId: string
): Promise<void>
```

**Implementation details**:
- Use `.select('*, aquarium_type:aquarium_types(id, name)')` for list endpoint
- Use `.select('*, aquarium_type:aquarium_types(id, name, description)')` for get endpoint
- Verify ownership by filtering with `.eq('user_id', userId)` in all queries
- Throw specific error codes: `FORBIDDEN`, `NOT_FOUND`, `DUPLICATE_AQUARIUM_NAME`, `AQUARIUM_TYPE_NOT_FOUND`
- Handle Supabase error code `23505` for unique constraint violations

### Step 2: Add GET Handler to /api/aquariums/index.ts

**File**: `src/pages/api/aquariums/index.ts`

Add a `GET` export to the existing file:

```typescript
export const GET: APIRoute = async ({ request, locals }) => {
  // 1. Validate query parameters
  // 2. Get user ID
  // 3. Call service.listAquariums()
  // 4. Return 200 with AquariumsListResponseDTO
  // 5. Handle errors (400, 401, 500)
}
```

**Validation schema**:
```typescript
const listQuerySchema = z.object({
  sort: z.enum(['name', 'created_at']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
});
```

### Step 3: Create /api/aquariums/[id].ts File

**File**: `src/pages/api/aquariums/[id].ts`

Create new file with three handlers: `GET`, `PATCH`, `DELETE`

**Shared validation**:
```typescript
const uuidSchema = z.string().uuid('Invalid aquarium ID format');
const updateAquariumSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').optional(),
  aquarium_type_id: z.string().uuid('Invalid aquarium type ID').optional(),
  description: z.string().optional(),
  volume: z.number().positive('Volume must be positive').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});
```

**GET handler**:
```typescript
export const GET: APIRoute = async ({ params, locals }) => {
  // 1. Validate params.id
  // 2. Get user ID
  // 3. Call service.getAquarium()
  // 4. Return 200 with AquariumResponseDTO
  // 5. Handle errors (400, 401, 403, 404, 500)
}
```

**PATCH handler**:
```typescript
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // 1. Validate params.id
  // 2. Parse and validate request body
  // 3. Get user ID
  // 4. Call service.updateAquarium()
  // 5. Return 200 with UpdateAquariumResponseDTO
  // 6. Handle errors (400, 401, 403, 404, 409, 500)
}
```

**DELETE handler**:
```typescript
export const DELETE: APIRoute = async ({ params, locals }) => {
  // 1. Validate params.id
  // 2. Get user ID
  // 3. Call service.deleteAquarium()
  // 4. Return 204 No Content
  // 5. Handle errors (400, 401, 403, 404, 500)
}
```

### Step 4: Implement Error Response Helper (Optional)

**File**: `src/lib/utils.ts` (or new file `src/lib/api-helpers.ts`)

Create reusable error response helper to reduce code duplication:

```typescript
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: string | ValidationErrorDetail[]
): Response {
  return new Response(
    JSON.stringify({
      error: { code, message, details }
    } as ErrorResponseDTO),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

### Step 5: Add Comprehensive Error Handling

In all endpoint handlers, implement consistent error handling:

```typescript
try {
  // ... endpoint logic
} catch (error) {
  if (error instanceof Error) {
    switch (error.message) {
      case 'FORBIDDEN':
        return errorResponse('FORBIDDEN', 'You do not have permission to access this aquarium', 403);
      case 'NOT_FOUND':
        return errorResponse('NOT_FOUND', 'Aquarium not found', 404);
      case 'DUPLICATE_AQUARIUM_NAME':
        return errorResponse('CONFLICT', 'An aquarium with this name already exists', 409);
      case 'AQUARIUM_TYPE_NOT_FOUND':
        return errorResponse('NOT_FOUND', 'Aquarium type not found', 404);
    }
  }
  
  console.error('Unexpected error:', error);
  return errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', 500);
}
```

### Step 6: Test All Endpoints

**Manual testing checklist**:

1. **GET /api/aquariums**
   - [ ] Returns user's aquariums sorted by created_at desc (default)
   - [ ] Sorting by name asc works
   - [ ] Sorting by name desc works
   - [ ] Returns 400 for invalid sort field
   - [ ] Returns 400 for invalid order value
   - [ ] Returns empty array for user with no aquariums

2. **GET /api/aquariums/:id**
   - [ ] Returns aquarium with full details
   - [ ] Returns 404 for non-existent aquarium
   - [ ] Returns 403 for aquarium owned by another user
   - [ ] Returns 400 for invalid UUID format

3. **PATCH /api/aquariums/:id**
   - [ ] Updates name successfully
   - [ ] Updates aquarium_type_id successfully
   - [ ] Updates description successfully
   - [ ] Updates volume successfully
   - [ ] Updates multiple fields simultaneously
   - [ ] Returns 409 for duplicate name
   - [ ] Returns 404 for non-existent aquarium_type_id
   - [ ] Returns 403 for aquarium owned by another user
   - [ ] Returns 400 for empty request body
   - [ ] Returns 400 for invalid UUID format

4. **DELETE /api/aquariums/:id**
   - [ ] Deletes aquarium successfully
   - [ ] Returns 204 No Content
   - [ ] Cascade deletes measurements (verify in database)
   - [ ] Returns 404 for non-existent aquarium
   - [ ] Returns 403 for aquarium owned by another user
   - [ ] Returns 400 for invalid UUID format

### Step 7: Update API Documentation

Update the project's API documentation (if exists) or create HTTP test files:

**File**: `aquarium.http` (update existing)

Add test cases for new endpoints:
```http
### List Aquariums
GET http://localhost:4321/api/aquariums

### List Aquariums - Sort by name asc
GET http://localhost:4321/api/aquariums?sort=name&order=asc

### Get Single Aquarium
GET http://localhost:4321/api/aquariums/{{aquarium_id}}

### Update Aquarium
PATCH http://localhost:4321/api/aquariums/{{aquarium_id}}
Content-Type: application/json

{
  "name": "Updated Reef Tank"
}

### Delete Aquarium
DELETE http://localhost:4321/api/aquariums/{{aquarium_id}}
```

### Step 8: Validate RLS Policies

Ensure Row-Level Security policies are functioning correctly:

1. Verify RLS is enabled on `aquariums` table
2. Test that users can only access their own aquariums via direct database queries
3. Confirm cascade delete works (measurements are deleted when aquarium is deleted)

### Step 9: Code Review and Refactoring

Before considering the implementation complete:

1. Review all error messages for consistency and user-friendliness
2. Ensure all validation schemas follow the same patterns
3. Check that all service methods follow clean code guidelines (early returns, guard clauses)
4. Verify TypeScript types are used correctly throughout
5. Run ESLint and fix any warnings or errors
6. Ensure consistent naming conventions across all files

### Step 10: Performance Validation

1. Check query performance with `.explain()` if available
2. Verify indexes are being used (check `idx_aquariums_user`)
3. Ensure no N+1 query problems exist
4. Test with realistic data volumes (100+ aquariums per user)

---

## Notes

- **Authentication placeholder**: Currently using `DEFAULT_USER_ID`. This will be replaced with actual authentication in a future iteration.
- **Pagination**: Not implemented in MVP. Consider adding for list endpoint if users have many aquariums.
- **Soft deletes**: Not implemented in MVP. Aquariums are permanently deleted.
- **Audit logging**: Not implemented in MVP. Consider adding `updated_at` triggers in future.
- **updated_at field**: The database schema should have an `updated_at` field that auto-updates. Verify this is in place or add a trigger.

