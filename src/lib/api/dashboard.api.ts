import type {
  AquariumsListResponseDTO,
  LatestMeasurementsResponseDTO,
  DefaultOptimalValuesForTypeResponseDTO,
  RecommendationResponseDTO,
  GetRecommendationsCommand,
  BulkCreateMeasurementsCommand,
  ParametersListResponseDTO,
} from "@/types";

/**
 * API client for dashboard-related endpoints
 */
export class DashboardAPI {
  /**
   * Fetch all aquariums for the current user
   * @returns List of aquariums sorted by creation date (newest first)
   * @throws Error if request fails
   */
  async getAquariums(): Promise<AquariumsListResponseDTO> {
    const response = await fetch("/api/aquariums?sort=created_at&order=desc");

    if (!response.ok) {
      throw new Error("Failed to fetch aquariums");
    }

    return response.json();
  }

  /**
   * Fetch latest measurements for a specific aquarium
   * @param aquariumId - The ID of the aquarium
   * @returns Latest measurement for each parameter
   * @throws Error if request fails
   */
  async getLatestMeasurements(aquariumId: string): Promise<LatestMeasurementsResponseDTO> {
    const response = await fetch(`/api/measurements/${aquariumId}/latest`);

    if (!response.ok) {
      throw new Error("Failed to fetch measurements");
    }

    return response.json();
  }

  /**
   * Fetch optimal values for a specific aquarium type
   * @param aquariumTypeId - The ID of the aquarium type
   * @returns List of optimal ranges for each parameter
   * @throws Error if request fails
   */
  async getOptimalValues(aquariumTypeId: string): Promise<DefaultOptimalValuesForTypeResponseDTO> {
    const response = await fetch(`/api/aquarium-types/${aquariumTypeId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch optimal values");
    }

    return response.json();
  }

  /**
   * Fetch AI recommendations for a specific parameter
   * @param aquariumId - The ID of the aquarium
   * @param command - The recommendation request parameters
   * @returns AI-generated analysis and recommendations
   * @throws Error if request fails
   */
  async getRecommendations(aquariumId: string, command: GetRecommendationsCommand): Promise<RecommendationResponseDTO> {
    const response = await fetch(`/api/aquariums/${aquariumId}/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recommendations");
    }

    return response.json();
  }

  /**
   * Fetch all available parameters
   * @returns List of all parameters (SG, kH, Ca, Mg, PO4, NO3, Temp)
   * @throws Error if request fails
   */
  async getParameters(): Promise<ParametersListResponseDTO> {
    const response = await fetch("/api/parameters");

    if (!response.ok) {
      throw new Error("Failed to fetch parameters");
    }

    return response.json();
  }

  /**
   * Create multiple measurements at once for an aquarium
   * @param aquariumId - The ID of the aquarium
   * @param command - The bulk measurement creation command
   * @returns Created measurements
   * @throws Error if request fails or validation fails
   */
  async createBulkMeasurements(
    aquariumId: string,
    command: BulkCreateMeasurementsCommand
  ): Promise<Record<string, unknown>> {
    const response = await fetch(`/api/measurements/${aquariumId}/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create measurements");
    }

    return response.json();
  }
}

/**
 * Singleton instance of DashboardAPI
 */
export const dashboardAPI = new DashboardAPI();
