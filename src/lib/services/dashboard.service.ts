import type { SupabaseClient } from "@/db/supabase.client";
import type {
  AquariumListItemDTO,
  LatestMeasurementDTO,
  DefaultOptimalValueWithParameterDTO,
  ParameterStatusViewModel,
} from "@/types";
import { calculateStatus } from "@/lib/utils/parameter-status";

export interface DashboardData {
  aquariums: AquariumListItemDTO[];
  selectedAquariumId: string | null;
  parameters: ParameterStatusViewModel[];
  lastMeasurementTime: string | null;
}

class DashboardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Load all dashboard data for a user
   */
  async getDashboardData(userId: string, preferredAquariumId?: string | null): Promise<DashboardData> {
    const aquariums = await this.fetchUserAquariums(userId);

    if (aquariums.length === 0) {
      return this.createEmptyDashboardData();
    }

    const selectedAquariumId = this.determineSelectedAquariumId(aquariums, preferredAquariumId);
    const selectedAquarium = aquariums.find((a) => a.id === selectedAquariumId);

    if (!selectedAquarium) {
      throw new Error(`Selected aquarium with ID ${selectedAquariumId} not found`);
    }

    // Fetch measurements and optimal values in parallel
    const [measurements, optimalValues] = await Promise.all([
      this.getLatestMeasurements(selectedAquariumId),
      this.getOptimalValuesForType(selectedAquarium.aquarium_type_id),
    ]);

    const lastMeasurementTime = this.findMostRecentMeasurementTime(measurements);
    const parameters = this.calculateParameterStatuses(measurements, optimalValues);

    return {
      aquariums,
      selectedAquariumId,
      parameters,
      lastMeasurementTime,
    };
  }

  /**
   * Fetch all aquariums for a user, ordered by creation date (newest first)
   */
  private async fetchUserAquariums(userId: string): Promise<AquariumListItemDTO[]> {
    const { data, error } = await this.supabase
      .from("aquariums")
      .select(
        `
        id,
        user_id,
        aquarium_type_id,
        name,
        description,
        volume,
        created_at,
        updated_at,
        aquarium_type:aquarium_types(id, name)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create empty dashboard data for users with no aquariums
   */
  private createEmptyDashboardData(): DashboardData {
    return {
      aquariums: [],
      selectedAquariumId: null,
      parameters: [],
      lastMeasurementTime: null,
    };
  }

  /**
   * Determine which aquarium should be selected
   */
  private determineSelectedAquariumId(aquariums: AquariumListItemDTO[], preferredAquariumId?: string | null): string {
    // Use preferred aquarium if it exists and is valid
    if (preferredAquariumId && aquariums.some((a) => a.id === preferredAquariumId)) {
      return preferredAquariumId;
    }

    // Default to first aquarium
    return aquariums[0].id;
  }

  /**
   * Get latest measurements for an aquarium
   */
  private async getLatestMeasurements(aquariumId: string): Promise<LatestMeasurementDTO[]> {
    const { data, error } = await this.supabase
      .from("measurements")
      .select(
        `
        id,
        aquarium_id,
        parameter_id,
        value,
        measurement_time,
        notes,
        created_at,
        parameter:parameters(id, name, full_name, unit)
      `
      )
      .eq("aquarium_id", aquariumId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Group by parameter_id and take the most recent measurement for each
    return this.groupLatestMeasurementsByParameter(data || []);
  }

  /**
   * Group measurements by parameter, keeping only the most recent for each
   */
  private groupLatestMeasurementsByParameter(measurements: any[]): LatestMeasurementDTO[] {
    const latestByParameter = new Map<string, LatestMeasurementDTO>();

    for (const measurement of measurements) {
      if (!latestByParameter.has(measurement.parameter_id)) {
        latestByParameter.set(measurement.parameter_id, measurement);
      }
    }

    return Array.from(latestByParameter.values());
  }

  /**
   * Get optimal values for an aquarium type
   */
  private async getOptimalValuesForType(aquariumTypeId: string): Promise<DefaultOptimalValueWithParameterDTO[]> {
    const { data, error } = await this.supabase
      .from("default_optimal_values")
      .select(
        `
        id,
        parameter_id,
        min_value,
        max_value,
        parameter:parameters(id, name, full_name, unit)
      `
      )
      .eq("aquarium_type_id", aquariumTypeId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Find the most recent measurement time from a list of measurements
   */
  private findMostRecentMeasurementTime(measurements: LatestMeasurementDTO[]): string | null {
    if (measurements.length === 0) return null;

    return measurements.reduce((latest, current) =>
      new Date(current.measurement_time) > new Date(latest.measurement_time) ? current : latest
    ).measurement_time;
  }

  /**
   * Calculate parameter status view models
   */
  private calculateParameterStatuses(
    measurements: LatestMeasurementDTO[],
    optimalValues: DefaultOptimalValueWithParameterDTO[]
  ): ParameterStatusViewModel[] {
    if (optimalValues.length === 0) return [];

    // Create measurement lookup map
    const measurementMap = new Map(measurements.map((m) => [m.parameter_id, m]));

    // Combine optimal values with measurements
    const parameters = optimalValues.map((optimal) => {
      const measurement = measurementMap.get(optimal.parameter_id);
      return this.createParameterStatus(optimal, measurement);
    });

    // Sort by status priority, then by name
    return this.sortParametersByStatusAndName(parameters);
  }

  /**
   * Create a parameter status view model from optimal value and measurement
   */
  private createParameterStatus(
    optimal: DefaultOptimalValueWithParameterDTO,
    measurement?: LatestMeasurementDTO
  ): ParameterStatusViewModel {
    const currentValue = measurement?.value ?? null;
    const { status, deviationPercentage } = calculateStatus(currentValue, optimal.min_value, optimal.max_value);

    return {
      parameterId: optimal.parameter_id,
      name: optimal.parameter.name,
      fullName: optimal.parameter.full_name,
      unit: optimal.parameter.unit,
      currentValue,
      optimalMin: optimal.min_value,
      optimalMax: optimal.max_value,
      deviationPercentage,
      status,
      measurementTime: measurement?.measurement_time ?? null,
    };
  }

  /**
   * Sort parameters by status priority (critical > warning > normal > no_data), then by name
   */
  private sortParametersByStatusAndName(parameters: ParameterStatusViewModel[]): ParameterStatusViewModel[] {
    const statusPriority = { critical: 0, warning: 1, normal: 2, no_data: 3 };

    return [...parameters].sort((a, b) => {
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.name.localeCompare(b.name);
    });
  }
}

export default DashboardService;
