import type { Database } from "./db/database.types";

// ============================================================================
// Database Entity Types
// ============================================================================

// Extract table row types from Database
type Tables = Database["public"]["Tables"];

export type AquariumTypeEntity = Tables["aquarium_types"]["Row"];
export type AquariumTypeInsert = Tables["aquarium_types"]["Insert"];
export type AquariumTypeUpdate = Tables["aquarium_types"]["Update"];

export type AquariumEntity = Tables["aquariums"]["Row"];
export type AquariumInsert = Tables["aquariums"]["Insert"];
export type AquariumUpdate = Tables["aquariums"]["Update"];

export type ParameterEntity = Tables["parameters"]["Row"];
export type ParameterInsert = Tables["parameters"]["Insert"];
export type ParameterUpdate = Tables["parameters"]["Update"];

export type DefaultOptimalValueEntity = Tables["default_optimal_values"]["Row"];
export type DefaultOptimalValueInsert = Tables["default_optimal_values"]["Insert"];
export type DefaultOptimalValueUpdate = Tables["default_optimal_values"]["Update"];

export type MeasurementEntity = Tables["measurements"]["Row"];
export type MeasurementInsert = Tables["measurements"]["Insert"];
export type MeasurementUpdate = Tables["measurements"]["Update"];

// ============================================================================
// Authentication DTOs and Commands
// ============================================================================

/**
 * Command for user sign up
 * Used in: POST /api/auth/signup
 */
export interface SignUpCommand {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Command for user sign in
 * Used in: POST /api/auth/signin
 */
export interface SignInCommand {
  email: string;
  password: string;
}

/**
 * Command for requesting password reset
 * Used in: POST /api/auth/reset-password
 */
export interface RequestPasswordResetCommand {
  email: string;
}

/**
 * Command for updating password with reset token
 * Used in: POST /api/auth/update-password
 */
export interface UpdatePasswordCommand {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * User information in authentication responses
 */
export interface UserDTO {
  id: string;
  email: string;
}

/**
 * Session information in authentication responses
 */
export interface SessionDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * Authentication response with user and session
 * Used in: POST /api/auth/signup, POST /api/auth/signin
 */
export interface AuthResponseDTO {
  user: UserDTO;
  session: SessionDTO;
}

// ============================================================================
// Aquarium Types DTOs
// ============================================================================

/**
 * Aquarium Type DTO - based on aquarium_types table
 * Used in: GET /api/aquarium-types, GET /api/aquarium-types/:id
 */
export type AquariumTypeDTO = Pick<AquariumTypeEntity, "id" | "name" | "description" | "created_at">;

/**
 * Aquarium Type DTO without timestamp - used in nested objects
 */
export type AquariumTypeSimpleDTO = Pick<AquariumTypeEntity, "id" | "name" | "description">;

// ============================================================================
// Parameters DTOs
// ============================================================================

/**
 * Parameter DTO - based on parameters table
 * Used in: GET /api/parameters, GET /api/parameters/:id
 */
export type ParameterDTO = Pick<ParameterEntity, "id" | "name" | "full_name" | "unit" | "description">;

/**
 * Parameter DTO for nested use in measurements
 */
export type ParameterSimpleDTO = Pick<ParameterEntity, "id" | "name" | "full_name" | "unit">;

// ============================================================================
// Default Optimal Values DTOs
// ============================================================================

/**
 * Default Optimal Value DTO with nested relations
 * Used in: GET /api/default-optimal-values
 */
export interface DefaultOptimalValueDTO {
  id: string;
  aquarium_type_id: string;
  parameter_id: string;
  min_value: number;
  max_value: number;
  aquarium_type: {
    name: string;
  };
  parameter: {
    name: string;
    unit: string;
  };
}

/**
 * Default Optimal Value DTO for aquarium type endpoint
 * Used in: GET /api/aquarium-types/:id/optimal-values
 */
export interface DefaultOptimalValueWithParameterDTO {
  id: string;
  parameter_id: string;
  min_value: number;
  max_value: number;
  parameter: {
    name: string;
    full_name: string;
    unit: string;
  };
}

// ============================================================================
// Aquariums DTOs and Commands
// ============================================================================

/**
 * Command for creating a new aquarium
 * Used in: POST /api/aquariums
 */
export interface CreateAquariumCommand {
  name: string;
  aquarium_type_id: string;
  description?: string;
  volume?: number;
}

/**
 * Command for updating an existing aquarium
 * Used in: PATCH /api/aquariums/:id
 */
export interface UpdateAquariumCommand {
  name?: string;
  aquarium_type_id?: string;
  description?: string;
  volume?: number;
}

/**
 * Aquarium DTO with nested aquarium type
 * Used in: GET /api/aquariums, GET /api/aquariums/:id, POST /api/aquariums, PATCH /api/aquariums/:id
 */
export interface AquariumDTO {
  id: string;
  user_id: string;
  aquarium_type_id: string;
  name: string;
  description: string | null;
  volume: number | null;
  created_at: string;
  updated_at: string;
  aquarium_type: {
    id: string;
    name: string;
    description?: string | null;
  };
}

/**
 * Simplified Aquarium DTO for list views
 */
export type AquariumListItemDTO = Omit<AquariumDTO, "aquarium_type"> & {
  aquarium_type: {
    id: string;
    name: string;
  };
};

// ============================================================================
// Measurements DTOs and Commands
// ============================================================================

/**
 * Command for creating a single measurement
 * Used in: POST /api/measurements/:aquariumId
 */
export interface CreateMeasurementCommand {
  parameter_id: string;
  value: number;
  measurement_time?: string;
  notes?: string;
}

/**
 * Single measurement item for bulk creation
 */
export interface BulkMeasurementItem {
  parameter_id: string;
  value: number;
  notes?: string;
}

/**
 * Command for bulk creating measurements
 * Used in: POST /api/measurements/:aquariumId/bulk
 */
export interface BulkCreateMeasurementsCommand {
  measurement_time?: string;
  measurements: BulkMeasurementItem[];
}

/**
 * Command for updating a measurement
 * Used in: PATCH /api/measurements/:id
 */
export interface UpdateMeasurementCommand {
  value?: number;
  measurement_time?: string;
  notes?: string;
}

/**
 * Measurement DTO with nested parameter
 * Used in: GET /api/measurements/:aquariumId, GET /api/measurements/:id, etc.
 */
export interface MeasurementDTO {
  id: string;
  aquarium_id: string;
  parameter_id: string;
  value: number;
  measurement_time: string;
  notes: string | null;
  created_at: string;
  parameter: {
    name: string;
    full_name: string;
    unit: string;
  };
}

/**
 * Latest measurement DTO with full parameter details
 * Used in: GET /api/measurements/:aquariumId/latest
 */
export interface LatestMeasurementDTO {
  id: string;
  aquarium_id: string;
  parameter_id: string;
  value: number;
  measurement_time: string;
  notes: string | null;
  created_at: string;
  parameter: {
    id: string;
    name: string;
    full_name: string;
    unit: string;
  };
}

/**
 * Measurement date for calendar display
 * Used in: GET /api/measurements/:aquariumId/calendar
 */
export interface MeasurementDateDTO {
  date: string; // YYYY-MM-DD format
  measurement_count: number;
}

/**
 * Pagination metadata
 */
export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// AI Recommendations DTOs and Commands
// ============================================================================

/**
 * Command for requesting AI recommendations
 * Used in: POST /api/aquariums/:id/recommendations
 */
export interface GetRecommendationsCommand {
  parameter_id: string;
  current_value: number;
  optimal_min: number;
  optimal_max: number;
}

/**
 * Optimal range DTO
 */
export interface OptimalRangeDTO {
  min: number;
  max: number;
}

/**
 * Parameter status type
 */
export type ParameterStatus = "normal" | "warning" | "critical" | "no_data";

/**
 * AI Recommendation response
 * Used in: POST /api/aquariums/:id/recommendations
 */
export interface RecommendationDTO {
  parameter: {
    id: string;
    name: string;
    full_name: string;
    unit: string;
  };
  current_value: number;
  optimal_range: OptimalRangeDTO;
  deviation_percentage: number;
  status: Exclude<ParameterStatus, "no_data">; // Recommendations only for parameters with data
  analysis: string;
  recommendations: string[];
  disclaimer: string;
}

/**
 * Parameter status for dashboard
 */
export interface ParameterStatusDTO {
  parameter: {
    id: string;
    name: string;
    full_name: string;
    unit: string;
  };
  current_value: number | null;
  optimal_range: OptimalRangeDTO;
  deviation_percentage: number | null;
  status: ParameterStatus;
  measurement_time: string | null;
}

/**
 * Dashboard response
 * Used in: GET /api/aquariums/:id/dashboard
 */
export interface DashboardDTO {
  aquarium: {
    id: string;
    name: string;
    aquarium_type_id: string;
    aquarium_type: {
      name: string;
    };
  };
  latest_measurement_time: string | null;
  parameters: ParameterStatusDTO[];
}

// ============================================================================
// Generic API Response Wrappers
// ============================================================================

/**
 * Generic API response wrapper for single items
 */
export interface ApiResponseDTO<T> {
  data: T;
}

/**
 * Generic API response wrapper for lists
 */
export interface ApiListResponseDTO<T> {
  data: T[];
}

/**
 * API response wrapper for paginated lists
 */
export interface ApiPaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationDTO;
}

// ============================================================================
// Error Response DTOs
// ============================================================================

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Error response DTO
 */
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: string | ValidationErrorDetail[];
  };
}

// ============================================================================
// Specific API Response Types (Type Aliases for Clarity)
// ============================================================================

// Authentication responses
export type SignUpResponseDTO = AuthResponseDTO;
export type SignInResponseDTO = AuthResponseDTO;
export type PasswordResetMessageDTO = ApiResponseDTO<{ message: string }>;
export type UpdatePasswordResponseDTO = ApiResponseDTO<{ message: string }>;

// Aquarium Types responses
export type AquariumTypesListResponseDTO = ApiListResponseDTO<AquariumTypeDTO>;
export type AquariumTypeResponseDTO = ApiResponseDTO<AquariumTypeDTO>;

// Parameters responses
export type ParametersListResponseDTO = ApiListResponseDTO<ParameterDTO>;
export type ParameterResponseDTO = ApiResponseDTO<ParameterDTO>;

// Default Optimal Values responses
export type DefaultOptimalValuesListResponseDTO = ApiListResponseDTO<DefaultOptimalValueDTO>;
export type DefaultOptimalValuesForTypeResponseDTO = ApiListResponseDTO<DefaultOptimalValueWithParameterDTO>;

// Aquariums responses
export type AquariumsListResponseDTO = ApiListResponseDTO<AquariumListItemDTO>;
export type AquariumResponseDTO = ApiResponseDTO<AquariumDTO>;
export type CreateAquariumResponseDTO = ApiResponseDTO<Omit<AquariumDTO, "aquarium_type"> & { aquarium_type?: never }>;
export type UpdateAquariumResponseDTO = ApiResponseDTO<Omit<AquariumDTO, "aquarium_type"> & { aquarium_type?: never }>;

// Measurements responses
export type MeasurementsListResponseDTO = ApiPaginatedResponseDTO<MeasurementDTO>;
export type LatestMeasurementsResponseDTO = ApiListResponseDTO<LatestMeasurementDTO>;
export type MeasurementsByDateResponseDTO = ApiListResponseDTO<MeasurementDTO>;
export type MeasurementCalendarResponseDTO = ApiListResponseDTO<MeasurementDateDTO>;
export type MeasurementResponseDTO = ApiResponseDTO<MeasurementDTO>;
export type CreateMeasurementResponseDTO = ApiResponseDTO<Omit<MeasurementDTO, "parameter">>;
export type BulkCreateMeasurementsResponseDTO = ApiListResponseDTO<Omit<MeasurementDTO, "parameter">>;
export type UpdateMeasurementResponseDTO = ApiResponseDTO<Omit<MeasurementDTO, "parameter">>;

// AI Recommendations responses
export type RecommendationResponseDTO = ApiResponseDTO<RecommendationDTO>;
export type DashboardResponseDTO = ApiResponseDTO<DashboardDTO>;

// ============================================================================
// Dashboard View Models
// ============================================================================

/**
 * Parameter status view model for dashboard cards
 * Combines measurement data with optimal ranges and calculated status
 */
export interface ParameterStatusViewModel {
  parameterId: string;
  name: string;
  fullName: string;
  unit: string;
  currentValue: number | null;
  optimalMin: number;
  optimalMax: number;
  deviationPercentage: number | null;
  status: ParameterStatus;
  measurementTime: string | null;
}

/**
 * Main view model for dashboard state
 */
export interface DashboardViewModel {
  aquariums: AquariumListItemDTO[];
  selectedAquariumId: string | null;
  parameters: ParameterStatusViewModel[];
  lastMeasurementTime: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Type for empty state variants
 */
export type DashboardEmptyStateType = "no-aquariums" | "no-measurements" | "loading" | null;
