# API Endpoint Implementation Plan: Reference Data Endpoints

## 1. Endpoint Overview
This plan covers the implementation of 6 read-only REST API endpoints that provide reference data for the ReefMetrics application. These endpoints serve foundational data about aquarium types, water parameters, and default optimal values that other system components depend on. All endpoints are GET-only and require user authentication.

## 2. Request Details
### HTTP Methods and URL Structures
- **GET** `/api/aquarium-types` - List all aquarium types
- **GET** `/api/aquarium-types/:id` - Get single aquarium type by ID
- **GET** `/api/parameters` - List all parameters  
- **GET** `/api/parameters/:id` - Get single parameter by ID
- **GET** `/api/default-optimal-values` - List default optimal values with optional filters
- **GET** `/api/aquarium-types/:aquariumTypeId/optimal-values` - Get optimal values for specific aquarium type

### Parameters
#### Required Parameters
- Path parameters `id` and `aquariumTypeId` must be valid UUIDs for single-item endpoints

#### Optional Parameters  
- Query parameters for `/api/default-optimal-values`:
  - `aquarium_type_id`: UUID to filter by aquarium type
  - `parameter_id`: UUID to filter by parameter

#### Request Body
- None (all endpoints are GET requests)

## 3. Used Types
### DTO Types
- `AquariumTypeDTO` - Response type for aquarium types endpoints
- `ParameterDTO` - Response type for parameters endpoints
- `DefaultOptimalValueDTO` - Response type for default optimal values list
- `DefaultOptimalValueWithParameterDTO` - Response type for optimal values by aquarium type

### Command Models
- None required (read-only endpoints)

## 4. Response Details
### Success Responses (200 OK)
All responses follow the consistent format:
```json
{
  "data": [/* array of items */] | {/* single item */}
}
```

### Error Responses
- **401 Unauthorized**: `{"error": {"code": "UNAUTHORIZED", "message": "Authentication required"}}`
- **400 Bad Request**: `{"error": {"code": "VALIDATION_ERROR", "message": "Invalid parameters", "details": [...]}}`
- **404 Not Found**: `{"error": {"code": "NOT_FOUND", "message": "Resource not found"}}`
- **500 Internal Server Error**: `{"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}}`

## 5. Data Flow
1. **Authentication Check**: Middleware validates Supabase JWT token
2. **Parameter Validation**: Zod schemas validate path and query parameters
3. **Service Call**: ReferenceDataService handles database queries with proper joins
4. **Data Transformation**: Service formats data according to DTO specifications
5. **Response**: Formatted data returned with appropriate HTTP status

### Database Interactions
- Queries use Supabase client with RLS policies
- Joins performed for nested object data (aquarium_type, parameter relations)
- Filtering applied for optional query parameters
- Count operations where needed for validation

## 6. Security Considerations
### Authentication & Authorization
- All endpoints require valid Supabase JWT token
- User session validated on each request
- RLS policies ensure users can only access reference data

### Input Validation
- UUID format validation for all ID parameters
- Query parameter sanitization
- No user-controlled data in database queries (parameterized queries)

### Data Protection
- No sensitive data exposed in reference endpoints
- Consistent error messages prevent information disclosure
- Rate limiting should be considered for high-traffic scenarios

## 7. Error Handling
### Validation Errors (400)
- Invalid UUID format in path parameters
- Malformed query parameters
- Non-existent filter values

### Authentication Errors (401)
- Missing or invalid JWT token
- Expired user session

### Not Found Errors (404)
- Aquarium type ID does not exist
- Parameter ID does not exist
- Aquarium type ID in optimal-values endpoint does not exist

### Server Errors (500)
- Database connection failures
- Unexpected query errors
- Data transformation failures

### Logging Strategy
- Use `console.error()` for server-side errors with structured logging
- Include user ID, endpoint, and error details for debugging
- Follow implementation rules for error logging patterns

## 8. Performance Considerations
### Database Optimization
- Use appropriate indexes on frequently queried columns (id, aquarium_type_id, parameter_id)
- Implement query result caching for reference data
- Optimize joins to minimize database load

### Response Optimization
- Consider pagination for large result sets (though reference data is typically small)
- Implement proper HTTP caching headers for static reference data
- Minimize data transfer by returning only required fields

### Monitoring
- Track response times for performance monitoring
- Monitor error rates for reliability insights
- Consider API usage metrics for optimization decisions

## 9. Implementation Steps

1. **Create ReferenceDataService** (`src/lib/services/reference-data.service.ts`)
   - Implement methods: `getAquariumTypes()`, `getAquariumType(id)`, `getParameters()`, `getParameter(id)`, `getDefaultOptimalValues(filters)`, `getOptimalValuesForAquariumType(aquariumTypeId)`
   - Add proper error handling and data transformation
   - Use Supabase client with RLS

2. **Create Zod Validation Schemas**
   - Define schemas for path parameters (UUID validation)
   - Define schema for query parameters in default-optimal-values endpoint
   - Export schemas for reuse in endpoint handlers

3. **Implement API Route Handlers**
   - Create `src/pages/api/aquarium-types/index.ts` for list endpoint
   - Create `src/pages/api/aquarium-types/[id].ts` for single item endpoint
   - Create `src/pages/api/parameters/index.ts` for parameters list
   - Create `src/pages/api/parameters/[id].ts` for single parameter
   - Create `src/pages/api/default-optimal-values/index.ts` for filtered list
   - Create `src/pages/api/aquarium-types/[...aquariumTypeId].ts` for optimal values by type

4. **Add Authentication Middleware Checks**
   - Verify Supabase user session in each endpoint
   - Return 401 for unauthenticated requests
   - Extract user ID for service calls

5. **Implement Error Handling**
   - Add try-catch blocks with proper error responses
   - Log errors with console.error() following implementation rules
   - Return appropriate HTTP status codes

6. **Add Input Validation**
   - Validate path parameters with Zod schemas
   - Validate query parameters where applicable
   - Return 400 for validation failures with detailed error messages

7. **Test Endpoints**
   - Add test cases to `aquarium.http` for all endpoints
   - Test success scenarios, authentication failures, and not found cases
   - Validate response formats match specifications

8. **Update Documentation**
   - Add endpoint documentation to README.md API section
   - Include examples and error scenarios
   - Document query parameter usage

9. **Code Review and Validation**
   - Run ESLint and fix any issues
   - Ensure TypeScript types are correct
   - Validate against implementation rules (early returns, guard clauses, etc.)
