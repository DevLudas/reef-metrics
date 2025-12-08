# REST API Plan

## 1. Resources

| Resource               | Database Table           | Description                                                            |
| ---------------------- | ------------------------ | ---------------------------------------------------------------------- |
| Aquarium Types         | `aquarium_types`         | Pre-populated aquarium categories (LPS, SPS, Fish Only, Mixed)         |
| Parameters             | `parameters`             | Pre-populated water parameters (SG, kH, Ca, Mg, PO4, NO3, Temperature) |
| Default Optimal Values | `default_optimal_values` | Pre-populated optimal parameter ranges for each aquarium type          |
| Aquariums              | `aquariums`              | User-owned aquariums                                                   |
| Measurements           | `measurements`           | Water parameter measurements for aquariums                             |
| AI Recommendations     | N/A (computed on-demand) | AI-generated recommendations for parameter deviations                  |

## 2. Endpoints

### 2.1 Authentication

#### Sign Up

- **Method**: `POST`
- **Path**: `/api/auth/signup`
- **Description**: Create a new user account
- **Request Body**:

```json
{
  "email": "string (required, valid email format)",
  "password": "string (required, min 8 characters)",
  "confirmPassword": "string (required, must match password)"
}
```

- **Response** (201 Created):

```json
{
  "user": {
    "id": "uuid",
    "email": "string"
  },
  "session": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_at": "number"
  }
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid email format, passwords don't match, or password too weak
  - `409 Conflict`: Email already exists

#### Sign In

- **Method**: `POST`
- **Path**: `/api/auth/signin`
- **Description**: Authenticate existing user
- **Request Body**:

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

- **Response** (200 OK):

```json
{
  "user": {
    "id": "uuid",
    "email": "string"
  },
  "session": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_at": "number"
  }
}
```

- **Error Responses**:
  - `400 Bad Request`: Missing email or password
  - `401 Unauthorized`: Invalid credentials

#### Sign Out

- **Method**: `POST`
- **Path**: `/api/auth/signout`
- **Description**: End user session
- **Request Body**: None (uses session token from cookies/headers)
- **Response** (204 No Content): Empty response
- **Error Responses**:
  - `401 Unauthorized`: No valid session

#### Request Password Reset

- **Method**: `POST`
- **Path**: `/api/auth/reset-password`
- **Description**: Request password reset email
- **Request Body**:

```json
{
  "email": "string (required)"
}
```

- **Response** (200 OK):

```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid email format

#### Update Password

- **Method**: `POST`
- **Path**: `/api/auth/update-password`
- **Description**: Update password using reset token
- **Request Body**:

```json
{
  "token": "string (required)",
  "password": "string (required, min 8 characters)",
  "confirmPassword": "string (required, must match password)"
}
```

- **Response** (200 OK):

```json
{
  "message": "Password updated successfully"
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid token, passwords don't match, or password too weak
  - `401 Unauthorized`: Expired or invalid token

### 2.2 Aquarium Types (Read-only reference data)

#### List All Aquarium Types

- **Method**: `GET`
- **Path**: `/api/aquarium-types`
- **Description**: Get all available aquarium types
- **Query Parameters**: None
- **Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string | null",
      "created_at": "timestamp"
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated

#### Get Single Aquarium Type

- **Method**: `GET`
- **Path**: `/api/aquarium-types/:id`
- **Description**: Get details of a specific aquarium type
- **Response** (200 OK):

```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string | null",
    "created_at": "timestamp"
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: Aquarium type not found

### 2.3 Parameters (Read-only reference data)

#### List All Parameters

- **Method**: `GET`
- **Path**: `/api/parameters`
- **Description**: Get all available water parameters
- **Query Parameters**: None
- **Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "full_name": "string",
      "unit": "string",
      "description": "string | null"
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated

#### Get Single Parameter

- **Method**: `GET`
- **Path**: `/api/parameters/:id`
- **Description**: Get details of a specific parameter
- **Response** (200 OK):

```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "full_name": "string",
    "unit": "string",
    "description": "string | null"
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: Parameter not found

### 2.4 Default Optimal Values (Read-only reference data)

#### List Default Optimal Values

- **Method**: `GET`
- **Path**: `/api/default-optimal-values`
- **Description**: Get default optimal parameter values
- **Query Parameters**:
  - `aquarium_type_id` (optional): Filter by aquarium type
  - `parameter_id` (optional): Filter by parameter
- **Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "aquarium_type_id": "uuid",
      "parameter_id": "uuid",
      "min_value": "number",
      "max_value": "number",
      "aquarium_type": {
        "name": "string"
      },
      "parameter": {
        "name": "string",
        "unit": "string"
      }
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `400 Bad Request`: Invalid query parameters

#### Get Default Optimal Values for Aquarium Type

- **Method**: `GET`
- **Path**: `/api/aquarium-types/:aquariumTypeId/optimal-values`
- **Description**: Get all default optimal values for a specific aquarium type
- **Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "parameter_id": "uuid",
      "min_value": "number",
      "max_value": "number",
      "parameter": {
        "name": "string",
        "full_name": "string",
        "unit": "string"
      }
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: Aquarium type not found

### 2.5 Aquariums

#### List User's Aquariums

- **Method**: `GET`
- **Path**: `/api/aquariums`
- **Description**: Get all aquariums belonging to the authenticated user
- **Query Parameters**:
  - `sort` (optional): Sort field (name, created_at) - default: created_at
  - `order` (optional): Sort order (asc, desc) - default: desc
- **Response** (200 OK):

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

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `400 Bad Request`: Invalid query parameters

#### Get Single Aquarium

- **Method**: `GET`
- **Path**: `/api/aquariums/:id`
- **Description**: Get details of a specific aquarium
- **Response** (200 OK):

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

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Aquarium belongs to another user
  - `404 Not Found`: Aquarium not found

#### Create Aquarium

- **Method**: `POST`
- **Path**: `/api/aquariums`
- **Description**: Create a new aquarium for the authenticated user
- **Request Body**:

```json
{
  "name": "string (required, min 1 char)",
  "aquarium_type_id": "uuid (required)",
  "description": "string (optional)",
  "volume": "number (optional, positive)"
}
```

- **Response** (201 Created):

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

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `400 Bad Request`: Invalid data or validation error
  - `409 Conflict`: Aquarium with this name already exists for the user
  - `404 Not Found`: Aquarium type not found

#### Update Aquarium

- **Method**: `PATCH`
- **Path**: `/api/aquariums/:id`
- **Description**: Update an existing aquarium
- **Request Body** (all fields optional):

```json
{
  "name": "string (min 1 char)",
  "aquarium_type_id": "uuid",
  "description": "string",
  "volume": "number (positive)"
}
```

- **Response** (200 OK):

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

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Aquarium belongs to another user
  - `404 Not Found`: Aquarium not found
  - `400 Bad Request`: Invalid data or validation error
  - `409 Conflict`: Aquarium with this name already exists for the user

#### Delete Aquarium

- **Method**: `DELETE`
- **Path**: `/api/aquariums/:id`
- **Description**: Delete an aquarium and all its measurements
- **Response** (204 No Content): Empty response
- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Aquarium belongs to another user
  - `404 Not Found`: Aquarium not found

### 2.6 Measurements

#### List Measurements for Aquarium

- **Method**: `GET`
- **Path**: `/api/measurements/:aquariumId`
- **Description**: Get measurements for a specific aquarium with filtering and pagination
- **Query Parameters**:
  - `start_date` (optional): Filter measurements from this date (ISO 8601)
  - `end_date` (optional): Filter measurements to this date (ISO 8601)
  - `parameter_id` (optional): Filter by specific parameter
  - `limit` (optional): Number of results per page (default: 50, max: 200)
  - `offset` (optional): Number of results to skip (default: 0)
  - `sort` (optional): Sort field (measurement_time) - default: measurement_time
  - `order` (optional): Sort order (asc, desc) - default: desc
- **Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "aquarium_id": "uuid",
      "parameter_id": "uuid",
      "value": "number",
      "measurement_time": "timestamp",
      "notes": "string | null",
      "created_at": "timestamp",
      "parameter": {
        "name": "string",
        "full_name": "string",
        "unit": "string"
      }
    }
  ],
  "pagination": {
    "total": "number",
    "limit": "number",
    "offset": "number"
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Aquarium belongs to another user
  - `404 Not Found`: Aquarium not found
  - `400 Bad Request`: Invalid query parameters

#### Get Latest Measurements for Aquarium

- **Method**: `GET`
- **Path**: `/api/measurements/:aquariumId/latest`
- **Description**: Get the most recent measurement for each parameter
- **Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "aquarium_id": "uuid",
      "parameter_id": "uuid",
      "value": "number",
      "measurement_time": "timestamp",
      "notes": "string | null",
      "created_at": "timestamp",
      "parameter": {
        "id": "uuid",
        "name": "string",
        "full_name": "string",
        "unit": "string"
      }
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Aquarium belongs to another user
  - `404 Not Found`: Aquarium not found

#### Get Measurements by Date

- **Method**: `GET`
- **Path**: `/api/measurements/:aquariumId/by-date/:date`
- **Description**: Get all measurements for a specific date (YYYY-MM-DD)
- **Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "aquarium_id": "uuid",
      "parameter_id": "uuid",
      "value": "number",
      "measurement_time": "timestamp",
      "notes": "string | null",
      "created_at": "timestamp",
      "parameter": {
        "name": "string",
        "full_name": "string",
        "unit": "string"
      }
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Aquarium belongs to another user
  - `404 Not Found`: Aquarium not found
  - `400 Bad Request`: Invalid date format

#### Get Measurement Dates Calendar

- **Method**: `GET`
- **Path**: `/api/measurements/:aquariumId/calendar`
- **Description**: Get list of dates that have measurements for calendar display
- **Query Parameters**:
  - `year` (optional): Filter by year (default: current year)
  - `month` (optional): Filter by month (1-12)
- **Response** (200 OK):

```json
{
  "data": [
    {
      "date": "YYYY-MM-DD",
      "measurement_count": "number"
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Aquarium belongs to another user
  - `404 Not Found`: Aquarium not found
  - `400 Bad Request`: Invalid query parameters

#### Get Single Measurement

- **Method**: `GET`
- **Path**: `/api/measurements/:id`
- **Description**: Get details of a specific measurement
- **Response** (200 OK):

```json
{
  "data": {
    "id": "uuid",
    "aquarium_id": "uuid",
    "parameter_id": "uuid",
    "value": "number",
    "measurement_time": "timestamp",
    "notes": "string | null",
    "created_at": "timestamp",
    "parameter": {
      "name": "string",
      "full_name": "string",
      "unit": "string"
    }
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Measurement belongs to another user's aquarium
  - `404 Not Found`: Measurement not found

#### Create Measurement

- **Method**: `POST`
- **Path**: `/api/aquariums/:aquariumId/measurements`
- **Description**: Create a new measurement for an aquarium
- **Request Body**:

```json
{
  "parameter_id": "uuid (required)",
  "value": "number (required, >= 0)",
  "measurement_time": "timestamp (optional, defaults to now)",
  "notes": "string (optional)"
}
```

- **Response** (201 Created):

```json
{
  "data": {
    "id": "uuid",
    "aquarium_id": "uuid",
    "parameter_id": "uuid",
    "value": "number",
    "measurement_time": "timestamp",
    "notes": "string | null",
    "created_at": "timestamp"
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Aquarium belongs to another user
  - `404 Not Found`: Aquarium or parameter not found
  - `400 Bad Request`: Invalid data or validation error (e.g., negative value)

#### Bulk Create Measurements

- **Method**: `POST`
- **Path**: `/api/aquariums/:aquariumId/measurements/bulk`
- **Description**: Create multiple measurements at once (for entering a full test set)
- **Request Body**:

```json
{
  "measurement_time": "timestamp (optional, defaults to now)",
  "measurements": [
    {
      "parameter_id": "uuid (required)",
      "value": "number (required, >= 0)",
      "notes": "string (optional)"
    }
  ]
}
```

- **Response** (201 Created):

```json
{
  "data": [
    {
      "id": "uuid",
      "aquarium_id": "uuid",
      "parameter_id": "uuid",
      "value": "number",
      "measurement_time": "timestamp",
      "notes": "string | null",
      "created_at": "timestamp"
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Aquarium belongs to another user
  - `404 Not Found`: Aquarium or parameter not found
  - `400 Bad Request`: Invalid data or validation error

#### Update Measurement

- **Method**: `PATCH`
- **Path**: `/api/measurements/:id`
- **Description**: Update an existing measurement
- **Request Body** (all fields optional):

```json
{
  "value": "number (>= 0)",
  "measurement_time": "timestamp",
  "notes": "string"
}
```

- **Response** (200 OK):

```json
{
  "data": {
    "id": "uuid",
    "aquarium_id": "uuid",
    "parameter_id": "uuid",
    "value": "number",
    "measurement_time": "timestamp",
    "notes": "string | null",
    "created_at": "timestamp"
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Measurement belongs to another user's aquarium
  - `404 Not Found`: Measurement not found
  - `400 Bad Request`: Invalid data or validation error

#### Delete Measurement

- **Method**: `DELETE`
- **Path**: `/api/measurements/:id`
- **Description**: Delete a measurement
- **Response** (204 No Content): Empty response
- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Measurement belongs to another user's aquarium
  - `404 Not Found`: Measurement not found

### 2.7 AI Recommendations

#### Get AI Recommendations for Parameter

- **Method**: `POST`
- **Path**: `/api/aquariums/:aquariumId/recommendations`
- **Description**: Generate AI recommendations for parameter deviations
- **Request Body**:

```json
{
  "parameter_id": "uuid (required)",
  "current_value": "number (required)",
  "optimal_min": "number (required)",
  "optimal_max": "number (required)"
}
```

- **Response** (200 OK):

```json
{
  "data": {
    "parameter": {
      "id": "uuid",
      "name": "string",
      "full_name": "string",
      "unit": "string"
    },
    "current_value": "number",
    "optimal_range": {
      "min": "number",
      "max": "number"
    },
    "deviation_percentage": "number",
    "status": "normal | warning | critical",
    "analysis": "string",
    "recommendations": ["string"],
    "disclaimer": "string"
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Aquarium belongs to another user
  - `404 Not Found`: Aquarium or parameter not found
  - `400 Bad Request`: Invalid data
  - `503 Service Unavailable`: AI service unavailable

#### Get Dashboard Analysis

- **Method**: `GET`
- **Path**: `/api/aquariums/:aquariumId/dashboard`
- **Description**: Get complete dashboard data with latest measurements and status indicators
- **Response** (200 OK):

```json
{
  "data": {
    "aquarium": {
      "id": "uuid",
      "name": "string",
      "aquarium_type_id": "uuid",
      "aquarium_type": {
        "name": "string"
      }
    },
    "latest_measurement_time": "timestamp | null",
    "parameters": [
      {
        "parameter": {
          "id": "uuid",
          "name": "string",
          "full_name": "string",
          "unit": "string"
        },
        "current_value": "number | null",
        "optimal_range": {
          "min": "number",
          "max": "number"
        },
        "deviation_percentage": "number | null",
        "status": "normal | warning | critical | no_data",
        "measurement_time": "timestamp | null"
      }
    ]
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Aquarium belongs to another user
  - `404 Not Found`: Aquarium not found

## 3. Authentication and Authorization

### Authentication Mechanism

The API uses **Supabase Auth** for authentication with session-based token management.

#### Implementation Details

1. **Session Tokens**: Supabase provides JWT access tokens and refresh tokens
2. **Token Storage**:
   - Access tokens stored in HTTP-only cookies for web clients
   - Tokens can also be passed via `Authorization: Bearer <token>` header
3. **Token Refresh**: Automatic refresh token rotation handled by Supabase client
4. **Session Duration**: Configurable (default: 1 hour for access tokens, 30 days for refresh tokens)

#### Middleware Integration

All API endpoints (except authentication endpoints) require authentication:

- Astro middleware extracts and validates the session token
- Supabase client is attached to `context.locals.supabase` with user context
- Row-Level Security (RLS) policies ensure data isolation between users

### Authorization

#### User-Level Authorization

- All resource access is controlled by Supabase RLS policies
- Users can only access their own data (aquariums, measurements)
- Reference data (aquarium types, parameters, default optimal values) is read-only for all authenticated users

#### Resource Ownership Verification

For endpoints accessing specific resources:

1. Authentication verified by middleware
2. RLS policies automatically filter results to user's data
3. Additional authorization checks in API endpoints for explicit error messages

### Security Measures

#### Rate Limiting

- Implement rate limiting at the API gateway level
- Suggested limits:
  - Authentication endpoints: 5 requests per minute per IP
  - Read endpoints: 100 requests per minute per user
  - Write endpoints: 30 requests per minute per user
  - AI recommendations: 10 requests per minute per user (due to external API costs)

#### Additional Security

- HTTPS-only in production
- CORS configuration limiting allowed origins
- Input validation using Zod schemas
- SQL injection prevention via parameterized queries (Supabase client)
- XSS prevention through proper output encoding
- CSRF protection via SameSite cookies

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Aquariums

- **name**: Required, minimum 1 character, maximum 255 characters
- **aquarium_type_id**: Required, must be a valid UUID, must exist in `aquarium_types` table
- **description**: Optional, maximum 1000 characters
- **volume**: Optional, must be positive number if provided, maximum 99999.99
- **Unique constraint**: `(user_id, name)` - user cannot have two aquariums with the same name

#### Measurements

- **parameter_id**: Required, must be a valid UUID, must exist in `parameters` table
- **value**: Required, must be a number >= 0 (CHECK constraint in database)
- **measurement_time**: Optional (defaults to current timestamp), must be valid timestamp, cannot be in the future
- **notes**: Optional, maximum 1000 characters
- **aquarium_id**: Must belong to the authenticated user (enforced by RLS)

#### Authentication

- **email**: Required, must be valid email format
- **password**: Required, minimum 8 characters, must contain at least one letter and one number
- **confirmPassword**: Must match password field

### 4.2 Business Logic Implementation

#### Dashboard Status Calculation

**Location**: `/api/aquariums/:aquariumId/dashboard` endpoint

**Logic**:

1. Fetch latest measurement for each parameter
2. Get optimal range from `default_optimal_values` for aquarium's type
3. Calculate deviation percentage: `|current_value - midpoint| / range * 100`
4. Determine status:
   - `no_data`: No measurement exists
   - `normal` (green): Deviation < 10%
   - `warning` (orange): Deviation 10-20%
   - `critical` (red): Deviation > 20%

#### AI Recommendation Generation

**Location**: `/api/aquariums/:aquariumId/recommendations` endpoint

**Logic**:

1. Validate parameter and optimal range
2. Calculate deviation from optimal range
3. Construct prompt for AI service (OpenRouter) including:
   - Parameter name and current value
   - Optimal range
   - Aquarium type context
   - Request for general recommendations (no product promotions)
4. Call AI API and parse response
5. Add disclaimer to response
6. Return structured recommendation

**AI Prompt Template**:

```
You are an expert marine aquarium consultant. Analyze the following water parameter:

Parameter: {full_name} ({name})
Current Value: {value} {unit}
Optimal Range: {min} - {max} {unit}
Aquarium Type: {aquarium_type_name}

The current value deviates by {deviation_percentage}% from the optimal range.

Provide:
1. A brief analysis of what this deviation means for the aquarium
2. 3-5 general corrective actions the user can take
3. Potential causes of this deviation

Keep recommendations general and educational. Do not promote specific commercial products.
```

#### Measurement Calendar

**Location**: `/api/aquariums/:aquariumId/measurements/calendar` endpoint

**Logic**:

1. Group measurements by date (using `DATE(measurement_time)`)
2. Count measurements per date
3. Filter by optional year/month parameters
4. Return array of dates with measurement counts for calendar display

#### Latest Measurements

**Location**: `/api/aquariums/:aquariumId/measurements/latest` endpoint

**Logic**:

1. For each parameter in `parameters` table
2. Find the most recent measurement (`MAX(measurement_time)`)
3. Return array with one entry per parameter
4. Include parameter details (name, unit, etc.)

#### Bulk Measurement Creation

**Location**: `/api/aquariums/:aquariumId/measurements/bulk` endpoint

**Logic**:

1. Validate all measurements in the batch
2. Use same `measurement_time` for all measurements in the batch
3. Execute as a database transaction (all succeed or all fail)
4. Return array of created measurements

### 4.3 Error Handling Strategy

#### Validation Errors (400)

- Use Zod for request body validation
- Return structured error responses with field-level details:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
```

#### Authentication Errors (401)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### Authorization Errors (403)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this resource"
  }
}
```

#### Not Found Errors (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

#### Conflict Errors (409)

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Resource already exists",
    "details": "An aquarium with this name already exists"
  }
}
```

#### Server Errors (500)

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

### 4.4 Database Constraints Enforcement

All database constraints are enforced at both the API level (for better error messages) and database level (for data integrity):

- **CHECK constraints**: `value >= 0`, `max_value > min_value`
- **UNIQUE constraints**: `(user_id, name)` for aquariums, `(aquarium_type_id, parameter_id)` for default optimal values
- **FOREIGN KEY constraints**: All relationships with appropriate `ON DELETE` behaviors
- **NOT NULL constraints**: All required fields
- **RLS policies**: Enforced by Supabase at the database level for multi-tenant data isolation

### 4.5 Performance Optimization

#### Pagination Strategy

- Use offset-based pagination for simplicity in MVP
- Default limit: 50 items
- Maximum limit: 200 items
- Return total count for UI pagination controls

#### Caching Strategy

- Reference data (aquarium types, parameters, default optimal values) can be cached client-side
- Latest measurements cached with short TTL (5 minutes)
- No caching for write operations

#### Database Query Optimization

- Use composite indexes defined in database schema
- Leverage Supabase's automatic query optimization
- Avoid N+1 queries by using joins for related data
- Use `select` to limit returned columns when possible
