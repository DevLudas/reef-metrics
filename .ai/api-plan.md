# REST API Plan for ReefMetrics

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Aquarium Types | `aquarium_types` | Pre-populated categories of marine aquariums (read-only) |
| Parameters | `parameters` | Pre-populated water parameters tracked by the app (read-only) |
| Aquariums | `aquariums` | User-owned aquariums |
| Measurements | `measurements` | Water parameter measurements for aquariums |
| Default Optimal Values | `default_optimal_values` | Pre-populated optimal ranges for parameters by aquarium type (read-only) |
| Dashboard | Computed from `measurements` and `default_optimal_values` | Dashboard data with status indicators |
| AI Analysis | External AI service integration | Parameter analysis and recommendations |

## 2. Endpoints

### 2.1 Aquarium Types

#### GET /api/aquarium-types

Retrieve all available aquarium types.

**Query Parameters:** None

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "SPS",
      "description": "Small Polyp Stony corals require stable water parameters"
    },
    {
      "id": "uuid",
      "name": "LPS",
      "description": "Large Polyp Stony corals are more forgiving"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token

---

#### GET /api/aquarium-types/:id

Retrieve a specific aquarium type by ID.

**Path Parameters:**
- `id` (UUID): Aquarium type identifier

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "name": "SPS",
    "description": "Small Polyp Stony corals require stable water parameters"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Aquarium type not found

---

#### GET /api/aquarium-types/:name/optimal-values

Retrieve default optimal parameter values for a specific aquarium type.

**Path Parameters:**
- `name` (string): Aquarium type name (e.g., "SPS", "LPS")

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "parameter": {
        "id": "uuid",
        "name": "Salinity",
        "unit": "SG"
      },
      "min_value": 1.024,
      "max_value": 1.026
    },
    {
      "id": "uuid",
      "parameter": {
        "id": "uuid",
        "name": "Calcium",
        "unit": "ppm"
      },
      "min_value": 400,
      "max_value": 450
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Aquarium type not found (invalid name)

---

### 2.3 Parameters

#### GET /api/parameters

Retrieve all available water parameters.

**Query Parameters:** None

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Salinity",
      "unit": "SG"
    },
    {
      "id": "uuid",
      "name": "Calcium",
      "unit": "ppm"
    },
    {
      "id": "uuid",
      "name": "Alkalinity",
      "unit": "dKH"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token

---

### 2.4 Aquariums

#### GET /api/aquariums

Retrieve all aquariums for the authenticated user.

**Query Parameters:**
- `limit` (number, optional): Number of results per page (default: 50, max: 100)
- `offset` (number, optional): Number of results to skip (default: 0)

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Main Reef Tank",
      "description": "150 gallon SPS dominated reef",
      "aquarium_type": {
        "id": "uuid",
        "name": "SPS",
        "description": "Small Polyp Stony corals"
      },
      "created_at": "2025-10-27T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token

---

#### GET /api/aquariums/:id

Retrieve a specific aquarium by ID.

**Path Parameters:**
- `id` (UUID): Aquarium identifier

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Main Reef Tank",
    "description": "150 gallon SPS dominated reef",
    "aquarium_type": {
      "id": "uuid",
      "name": "SPS",
      "description": "Small Polyp Stony corals"
    },
    "created_at": "2025-10-27T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Aquarium not found or doesn't belong to user

---

#### POST /api/aquariums

Create a new aquarium for the authenticated user.

**Request Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Main Reef Tank",
  "description": "150 gallon SPS dominated reef",
  "aquarium_type_id": "uuid"
}
```

**Validation Rules:**
- `name`: Required, string, non-empty
- `description`: Optional, string, max 255 characters
- `aquarium_type_id`: Required, valid UUID, must exist in aquarium_types

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Main Reef Tank",
    "description": "150 gallon SPS dominated reef",
    "aquarium_type": {
      "id": "uuid",
      "name": "SPS",
      "description": "Small Polyp Stony corals"
    },
    "created_at": "2025-10-27T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Validation errors
  ```json
  {
    "error": {
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
- `404 Not Found`: Aquarium type not found

---

#### PATCH /api/aquariums/:id

Update an existing aquarium.

**Path Parameters:**
- `id` (UUID): Aquarium identifier

**Request Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Tank Name",
  "description": "Updated description",
  "aquarium_type_id": "uuid"
}
```

**Validation Rules:**
- All fields are optional
- `name`: String, non-empty if provided
- `description`: String, max 255 characters if provided
- `aquarium_type_id`: Valid UUID, must exist in aquarium_types if provided

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Updated Tank Name",
    "description": "Updated description",
    "aquarium_type": {
      "id": "uuid",
      "name": "SPS",
      "description": "Small Polyp Stony corals"
    },
    "created_at": "2025-10-27T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Aquarium not found or doesn't belong to user
- `400 Bad Request`: Validation errors

---

#### DELETE /api/aquariums/:id

Delete an aquarium and all associated measurements.

**Path Parameters:**
- `id` (UUID): Aquarium identifier

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (204 No Content)**

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Aquarium not found or doesn't belong to user

---

### 2.5 Measurements

#### GET /api/aquariums/:aquariumId/measurements

Retrieve measurements for a specific aquarium.

**Path Parameters:**
- `aquariumId` (UUID): Aquarium identifier

**Query Parameters:**
- `parameter_id` (UUID, optional): Filter by specific parameter
- `date` (YYYY-MM-DD, optional): Filter by specific date
- `from` (YYYY-MM-DD, optional): Start date for range query
- `to` (YYYY-MM-DD, optional): End date for range query
- `limit` (number, optional): Number of results per page (default: 50, max: 100)
- `offset` (number, optional): Number of results to skip (default: 0)
- `sort` (string, optional): Sort order, either `asc` or `desc` (default: `desc`)

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "parameter": {
        "id": "uuid",
        "name": "Salinity",
        "unit": "SG"
      },
      "value": 1.025,
      "created_at": "2025-10-27T14:30:00Z"
    },
    {
      "id": "uuid",
      "parameter": {
        "id": "uuid",
        "name": "Calcium",
        "unit": "ppm"
      },
      "value": 420,
      "created_at": "2025-10-27T14:30:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 14
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Aquarium not found or doesn't belong to user
- `400 Bad Request`: Invalid query parameters

---

#### GET /api/aquariums/:aquariumId/measurements/:id

Retrieve a specific measurement by ID.

**Path Parameters:**
- `aquariumId` (UUID): Aquarium identifier
- `id` (UUID): Measurement identifier

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "parameter": {
      "id": "uuid",
      "name": "Salinity",
      "unit": "SG"
    },
    "value": 1.025,
    "created_at": "2025-10-27T14:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Measurement or aquarium not found

---

#### POST /api/aquariums/:aquariumId/measurements

Create one or more measurements for an aquarium.

**Path Parameters:**
- `aquariumId` (UUID): Aquarium identifier

**Request Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body (Single Measurement):**
```json
{
  "parameter_id": "uuid",
  "value": 1.025
}
```

**Request Body (Multiple Measurements - Batch):**
```json
{
  "measurements": [
    {
      "parameter_id": "uuid",
      "value": 1.025
    },
    {
      "parameter_id": "uuid",
      "value": 420
    }
  ]
}
```

**Validation Rules:**
- `parameter_id`: Required, valid UUID, must exist in parameters
- `value`: Required, numeric, precision NUMERIC(8,4)
- For batch: all measurements validated individually

**Response (201 Created):**

For single measurement:
```json
{
  "data": {
    "id": "uuid",
    "parameter": {
      "id": "uuid",
      "name": "Salinity",
      "unit": "SG"
    },
    "value": 1.025,
    "created_at": "2025-10-27T14:30:00Z"
  }
}
```

For batch measurements:
```json
{
  "data": [
    {
      "id": "uuid",
      "parameter": {
        "id": "uuid",
        "name": "Salinity",
        "unit": "SG"
      },
      "value": 1.025,
      "created_at": "2025-10-27T14:30:00Z"
    },
    {
      "id": "uuid",
      "parameter": {
        "id": "uuid",
        "name": "Calcium",
        "unit": "ppm"
      },
      "value": 420,
      "created_at": "2025-10-27T14:30:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Aquarium or parameter not found
- `400 Bad Request`: Validation errors
  ```json
  {
    "error": {
      "message": "Validation failed",
      "details": [
        {
          "field": "value",
          "message": "Value must be a number"
        }
      ]
    }
  }
  ```

---

#### PATCH /api/aquariums/:aquariumId/measurements/:id

Update an existing measurement.

**Path Parameters:**
- `aquariumId` (UUID): Aquarium identifier
- `id` (UUID): Measurement identifier

**Request Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "value": 1.026
}
```

**Validation Rules:**
- `value`: Required, numeric, precision NUMERIC(8,4)

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "parameter": {
      "id": "uuid",
      "name": "Salinity",
      "unit": "SG"
    },
    "value": 1.026,
    "created_at": "2025-10-27T14:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Measurement or aquarium not found
- `400 Bad Request`: Validation errors

---

#### DELETE /api/aquariums/:aquariumId/measurements/:id

Delete a measurement.

**Path Parameters:**
- `aquariumId` (UUID): Aquarium identifier
- `id` (UUID): Measurement identifier

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (204 No Content)**

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Measurement or aquarium not found

---

### 2.6 Dashboard

#### GET /api/aquariums/:aquariumId/dashboard

Retrieve dashboard data with latest measurements and status indicators.

**Path Parameters:**
- `aquariumId` (UUID): Aquarium identifier

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "data": {
    "aquarium": {
      "id": "uuid",
      "name": "Main Reef Tank",
      "aquarium_type": {
        "id": "uuid",
        "name": "SPS"
      }
    },
    "parameters": [
      {
        "parameter": {
          "id": "uuid",
          "name": "Salinity",
          "unit": "SG"
        },
        "current_value": 1.025,
        "optimal_range": {
          "min": 1.024,
          "max": 1.026
        },
        "status": "optimal",
        "deviation_percent": 0,
        "last_measured_at": "2025-10-27T14:30:00Z"
      },
      {
        "parameter": {
          "id": "uuid",
          "name": "Calcium",
          "unit": "ppm"
        },
        "current_value": 380,
        "optimal_range": {
          "min": 400,
          "max": 450
        },
        "status": "warning",
        "deviation_percent": 12.5,
        "last_measured_at": "2025-10-27T14:30:00Z"
      },
      {
        "parameter": {
          "id": "uuid",
          "name": "Alkalinity",
          "unit": "dKH"
        },
        "current_value": null,
        "optimal_range": {
          "min": 8.0,
          "max": 12.0
        },
        "status": "no_data",
        "deviation_percent": null,
        "last_measured_at": null
      }
    ]
  }
}
```

**Status Values:**
- `optimal`: Deviation < 10%
- `warning`: Deviation 10-20%
- `critical`: Deviation > 20%
- `no_data`: No measurements recorded for this parameter

**Deviation Calculation:**
```
optimal_mid = (min + max) / 2
deviation_percent = |(current_value - optimal_mid) / optimal_mid| * 100
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Aquarium not found or doesn't belong to user

---

### 2.7 AI Analysis

#### POST /api/aquariums/:aquariumId/parameters/:parameterId/analyze

Request AI analysis and recommendations for a specific parameter.

**Path Parameters:**
- `aquariumId` (UUID): Aquarium identifier
- `parameterId` (UUID): Parameter identifier

**Request Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "measurement_id": "uuid"
}
```

**Validation Rules:**
- `measurement_id`: Optional, valid UUID. If not provided, uses latest measurement

**Response (200 OK):**
```json
{
  "data": {
    "parameter": {
      "id": "uuid",
      "name": "Calcium",
      "unit": "ppm"
    },
    "measurement": {
      "id": "uuid",
      "value": 380,
      "created_at": "2025-10-27T14:30:00Z"
    },
    "optimal_range": {
      "min": 400,
      "max": 450
    },
    "status": "warning",
    "deviation_percent": 12.5,
    "analysis": {
      "summary": "Your calcium level is slightly below the optimal range for SPS corals.",
      "recommendations": [
        "Test your calcium again to confirm the reading",
        "Consider dosing calcium chloride to raise levels gradually",
        "Monitor alkalinity as well, as calcium and alkalinity are closely related",
        "Ensure your calcium reactor is functioning properly if you use one"
      ],
      "warnings": [
        "Do not raise calcium levels too quickly",
        "Always maintain proper alkalinity when adjusting calcium"
      ]
    },
    "disclaimer": "This analysis is provided as a recommendation only. Implementation of any suggested actions is solely your responsibility. Always research and verify recommendations before making changes to your aquarium.",
    "generated_at": "2025-10-27T14:35:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Aquarium, parameter, or measurement not found
- `429 Too Many Requests`: Rate limit exceeded (10 requests per minute per user)
  ```json
  {
    "error": {
      "message": "Rate limit exceeded",
      "retry_after": 45
    }
  }
  ```
- `503 Service Unavailable`: AI service unavailable
  ```json
  {
    "error": {
      "message": "AI analysis service is temporarily unavailable"
    }
  }
  ```

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

ReefMetrics uses **Supabase Auth** for user authentication, which provides:

- Email/password registration and login
- JWT (JSON Web Token) based sessions
- Password reset functionality
- Secure session management

**Implementation Details:**

1. **Client-Side**: Use the Supabase JavaScript client to handle authentication flows
2. **Server-Side**: Validate JWT tokens using Supabase's server-side utilities
3. **Token Format**: `Authorization: Bearer {jwt_token}` header on all authenticated requests
4. **Session Duration**: Tokens are valid for 1 hour, with automatic refresh handled by the Supabase client

### 3.2 Authorization (Row-Level Security)

All data access is controlled through **PostgreSQL Row-Level Security (RLS)** policies:

**Aquariums Table:**
- Users can only view, create, update, and delete their own aquariums
- `user_id` is automatically set to `auth.uid()` on creation
- All operations filtered by `WHERE auth.uid() = user_id`

**Measurements Table:**
- Users can only access measurements for aquariums they own
- Enforced through JOIN with aquariums table checking `user_id`

**Reference Tables (Read-Only):**
- `aquarium_types`: Public read access
- `parameters`: Public read access
- `default_optimal_values`: Public read access

**Implementation:**
- RLS is enabled on all user-data tables
- API endpoints use the Supabase client from `context.locals.supabase`
- The client automatically includes the user's JWT, enforcing RLS policies
- No manual user_id filtering needed in API code

### 3.3 API Security Best Practices

1. **HTTPS Only**: All API communication must use HTTPS in production
2. **CORS Configuration**: Restrict CORS to frontend domain only
3. **Input Sanitization**: Validate and sanitize all user inputs
4. **Rate Limiting**: 
   - General endpoints: 100 requests per minute per user
   - AI analysis endpoints: 10 requests per minute per user
5. **Error Messages**: Avoid exposing sensitive information in error messages

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Aquariums

| Field | Rules |
|-------|-------|
| `name` | Required, string, non-empty, max 255 characters |
| `description` | Optional, string, max 255 characters |
| `aquarium_type_id` | Required, valid UUID format, must exist in `aquarium_types` |

#### Measurements

| Field | Rules |
|-------|-------|
| `parameter_id` | Required, valid UUID format, must exist in `parameters` |
| `value` | Required, numeric, precision NUMERIC(8,4) (max 9999.9999) |
| `aquarium_id` | Required (from path), valid UUID, must belong to authenticated user |

### 4.2 Business Logic Implementation

#### 4.2.1 Dashboard Status Calculation

**Algorithm:**
```
1. For each parameter tracked by the app:
   a. Get latest measurement for the aquarium
   b. Get optimal range from default_optimal_values for the aquarium type
   c. Calculate optimal midpoint: mid = (min + max) / 2
   d. Calculate deviation: |value - mid| / mid * 100
   e. Assign status:
      - deviation < 10%: "optimal" (green)
      - deviation 10-20%: "warning" (orange)
      - deviation > 20%: "critical" (red)
      - no measurement: "no_data" (gray)
   f. Return parameter with value, range, status, and deviation
```

**Performance Optimization:**
- Use index `idx_measurements_latest` for efficient latest measurement queries
- Cache optimal values per aquarium type
- Single query with LEFT JOIN to get all parameters including unmeasured ones

#### 4.2.2 Batch Measurement Creation

**Algorithm:**
```
1. Accept array of measurement objects in request body
2. Validate each measurement individually
3. Set same timestamp for all measurements in the batch
4. Insert all measurements in a single transaction
5. Return all created measurements with generated IDs
```

**Benefits:**
- Allows users to enter all 7 parameters at once (typical use case)
- Maintains temporal consistency (all measurements from same test session)
- Reduces API calls from 7 to 1

#### 4.2.3 Historical Data Queries

**Filtering Logic:**
- `date` parameter: Return all measurements where DATE(created_at) = date
- `from` and `to` parameters: Return measurements where created_at BETWEEN from AND to
- `parameter_id`: Filter to specific parameter only
- Default sort: newest first (created_at DESC)
- Pagination: Use LIMIT and OFFSET for large result sets

#### 4.2.4 AI Analysis Generation

**Process Flow:**
```
1. Retrieve measurement details (value, timestamp)
2. Retrieve parameter information (name, unit)
3. Retrieve optimal range for aquarium type
4. Calculate deviation and status
5. Construct prompt for AI service:
   - Include aquarium type
   - Include parameter name, value, unit
   - Include optimal range
   - Include deviation percentage
   - Request: analysis summary, specific recommendations, warnings
   - Specify: no product promotion, general advice only
6. Call OpenRouter API with structured prompt
7. Parse AI response
8. Add disclaimer to response
9. Return formatted analysis
```

**Rate Limiting:**
- Limit: 10 requests per minute per user
- Prevents excessive AI API costs
- Returns 429 status with retry_after seconds

**Error Handling:**
- AI service timeout: Return 503 with user-friendly message
- Invalid response: Return generic error, log for debugging
- Cost limit reached: Return 503, notify administrators

### 4.3 Data Validation Error Responses

All validation errors return `400 Bad Request` with structured error information:

```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "field_name",
        "message": "Specific error message"
      }
    ]
  }
}
```

**Common Validation Errors:**
- Required field missing: `"{field} is required"`
- Invalid UUID format: `"Invalid UUID format for {field}"`
- Invalid numeric value: `"Value must be a number with max 4 decimal places"`
- String too long: `"{field} must be {max} characters or less"`
- Referenced entity not found: `"{entity} not found"`
- Out of range: `"Value must be between {min} and {max}"`

### 4.4 Database Constraints Enforcement

The API relies on PostgreSQL constraints for data integrity:

1. **Foreign Key Constraints**: Automatically validated by database
2. **NOT NULL Constraints**: Validated at API level before database insertion
3. **UNIQUE Constraints**: Database returns error, API translates to user-friendly message
4. **ON DELETE CASCADE**: Measurements automatically deleted when aquarium is deleted
5. **ON DELETE RESTRICT**: Prevents deletion of aquarium_types if referenced by aquariums

### 4.5 Timestamp Handling

- All timestamps stored as `TIMESTAMPTZ` (timezone-aware)
- `created_at` automatically set to `now()` if not provided
- Client can provide `created_at` for backdating measurements (e.g., manual data entry)
- All timestamps returned in ISO 8601 format with UTC timezone

---

## 5. API Versioning and Future Considerations

### 5.1 Current Version

- All endpoints are prefixed with `/api/`
- Current version: MVP (no version number in path)
- Breaking changes will introduce `/api/v2/` when needed

### 5.2 Potential Future Endpoints

While outside MVP scope, the API is designed to support:

- `GET /api/aquariums/:id/measurements/trends` - Parameter trends over time
- `POST /api/aquariums/:id/measurements/import` - CSV import
- `GET /api/aquariums/:id/reports` - Generate PDF reports
- `PATCH /api/aquariums/:id/optimal-values/:parameterId` - Custom optimal ranges
- `GET /api/measurements/export` - Export data

### 5.3 Deprecation Policy

When introducing breaking changes:
1. Announce deprecation 90 days in advance
2. Support old version for 180 days after new version release
3. Return `Deprecation` header with sunset date
4. Document migration path in API documentation

