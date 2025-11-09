# Measurements API Endpoints Implementation Plan

## 1. Endpoint Overview
This plan covers the implementation of 9 REST API endpoints for managing aquarium measurements in the ReefMetrics application. These endpoints enable users to list, retrieve, create, update, and delete measurements for their aquariums, with features like filtering, pagination, bulk operations, and calendar views. All endpoints enforce user authentication and ownership via Supabase RLS policies, ensuring data isolation. The implementation follows Astro's server endpoints, TypeScript for type safety, Zod for validation, and extracts business logic to the aquarium.service.ts for maintainability.

## 2. Request Details
- **HTTP Methods**: GET (for retrievals), POST (for creation), PATCH (for updates), DELETE (for deletion)
- **URL Structures**:
  - GET /api/aquariums/:aquariumId/measurements (list with filters/pagination)
  - GET /api/aquariums/:aquariumId/measurements/latest (latest per parameter)
  - GET /api/aquariums/:aquariumId/measurements/by-date/:date (measurements for a date)
  - GET /api/aquariums/:aquariumId/measurements/calendar (calendar dates)
  - GET /api/measurements/:id (single measurement)
  - POST /api/aquariums/:aquariumId/measurements (create single)
  - POST /api/aquariums/:aquariumId/measurements/bulk (create bulk)
  - PATCH /api/measurements/:id (update)
  - DELETE /api/measurements/:id (delete)
- **Parameters**:
  - **Required**: :aquariumId (UUID) for aquarium-specific endpoints, :id (UUID) for single measurement endpoints, parameter_id and value for creation
  - **Optional**: Query params for GET (e.g., start_date, end_date, limit, offset, sort, order), body fields for POST/PATCH (e.g., measurement_time, notes)
- **Request Body**: JSON for POST/PATCH, validated with Zod schemas matching CreateMeasurementCommand, BulkCreateMeasurementsCommand, UpdateMeasurementCommand

## 3. Used Types
- DTOs: MeasurementDTO, LatestMeasurementDTO, MeasurementDateDTO, PaginationDTO
- Commands: CreateMeasurementCommand, BulkCreateMeasurementsCommand, UpdateMeasurementCommand, BulkMeasurementItem
- Responses: MeasurementsListResponseDTO, LatestMeasurementsResponseDTO, MeasurementsByDateResponseDTO, MeasurementCalendarResponseDTO, MeasurementResponseDTO, CreateMeasurementResponseDTO, BulkCreateMeasurementsResponseDTO, UpdateMeasurementResponseDTO
- Error: ErrorResponseDTO

## 4. Response Details
- **Success Responses**: 200 OK for GET/PATCH, 201 Created for POST, 204 No Content for DELETE. Data wrapped in { "data": ... } for single/items, with pagination for lists. Consistent structure with nested parameter details.
- **Error Responses**: 400 Bad Request (invalid input), 401 Unauthorized (no auth), 403 Forbidden (ownership), 404 Not Found (resource missing), 500 Internal Server Error (unexpected). Use ErrorResponseDTO with code, message, and optional details.

## 5. Data Flow
1. Endpoint receives request, extracts params/body.
2. Validate input with Zod; return 400 on failure.
3. Authenticate via Supabase (locals.supabase); return 401 if invalid.
4. Call service methods (e.g., aquariumService.getMeasurements) for DB queries via Supabase client.
5. Service applies RLS (user ownership), performs queries with joins (e.g., to parameters table).
6. Transform results to DTOs, handle pagination.
7. Return response or handle errors (e.g., 403 if no rows due to RLS, 404 if not found).

## 6. Security Considerations
- Authentication: Required via Supabase JWT; check in middleware or endpoint.
- Authorization: RLS policies ensure users access only their aquariums' measurements; service queries enforce this.
- Input Validation: Zod prevents malicious payloads; sanitize UUIDs, enforce value >= 0.
- Data Exposure: No sensitive data; responses exclude user_id for security.
- Rate Limiting: Not implemented yet; consider for bulk endpoints to prevent abuse.
- SQL Injection: Mitigated by Supabase parameterized queries.

## 7. Error Handling
- Early returns for validation/auth failures.
- Catch service errors; log with console.error; return 500 for DB issues.
- Specific codes: 400 for Zod errors, 403 for ownership (via query result check), 404 for empty results.
- User-friendly messages; avoid exposing internals.

## 8. Performance Considerations
- Pagination limits large result sets; default 50, max 200.
- Indexes (e.g., idx_measurements_aquarium_time) optimize queries.
- Lazy loading for nested data; avoid N+1 queries with joins.
- Bulk operations reduce round-trips.
- Cache not needed for MVP; monitor Supabase performance.

## 9. Implementation Steps
1. Update aquarium.service.ts with new methods: getMeasurements (with filters/pagination), getLatestMeasurements, getMeasurementsByDate, getMeasurementCalendar, getMeasurement, createMeasurement, bulkCreateMeasurements, updateMeasurement, deleteMeasurement. Use Supabase client for queries, apply RLS.
2. Create Zod schemas in endpoints for validation (e.g., for query params and bodies).
3. Implement endpoints in src/pages/api/aquariums/[...aquariumId].ts and src/pages/api/measurements/[id].ts using Astro's API routes. Set export const prerender = false.
4. Add middleware checks for auth in each endpoint.
5. Handle errors with try-catch, return appropriate status codes.
6. Test endpoints with aquarium.http for CRUD, filtering, pagination, and error cases.
7. Validate with get_errors tool; fix lints following rules (early returns, guard clauses).
8. Ensure types align with types.ts; update if needed.
