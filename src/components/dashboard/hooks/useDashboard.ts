import { useState, useEffect, useCallback } from "react";
import type {
  AquariumListItemDTO,
  LatestMeasurementDTO,
  DefaultOptimalValueWithParameterDTO,
  ParameterStatusViewModel,
} from "@/types";
import { dashboardAPI } from "@/lib/api/dashboard.api";
import { calculateStatus } from "@/lib/utils/parameter-status";

const SELECTED_AQUARIUM_KEY = "reefmetrics:selected-aquarium-id";

export interface UseDashboardResult {
  // Data state
  aquariums: AquariumListItemDTO[];
  selectedAquariumId: string | null;
  parameters: ParameterStatusViewModel[];
  lastMeasurementTime: string | null;

  // UI state
  isLoading: boolean;
  isLoadingMeasurements: boolean;
  error: string | null;
  selectedParameter: ParameterStatusViewModel | null;
  isDrawerOpen: boolean;

  // Actions
  handleAquariumChange: (id: string) => void;
  handleParameterClick: (id: string) => void;
  handleDrawerClose: () => void;
  refreshMeasurements: () => Promise<void>;
}

/**
 * Custom hook for managing dashboard state and data fetching
 * Handles aquarium selection, measurements, optimal values, and parameter status calculation
 */
export function useDashboard(): UseDashboardResult {
  // Data state
  const [aquariums, setAquariums] = useState<AquariumListItemDTO[]>([]);
  const [selectedAquariumId, setSelectedAquariumId] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<LatestMeasurementDTO[]>([]);
  const [optimalValues, setOptimalValues] = useState<DefaultOptimalValueWithParameterDTO[]>([]);
  const [parameters, setParameters] = useState<ParameterStatusViewModel[]>([]);
  const [lastMeasurementTime, setLastMeasurementTime] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParameterId, setSelectedParameterId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load aquariums on mount
  useEffect(() => {
    async function loadAquariums() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await dashboardAPI.getAquariums();
        setAquariums(response.data);

        // Set initial selected aquarium
        if (response.data.length > 0) {
          // Try to restore from localStorage
          const savedAquariumId = localStorage.getItem(SELECTED_AQUARIUM_KEY);
          const aquariumExists = savedAquariumId ? response.data.some((a) => a.id === savedAquariumId) : false;

          if (aquariumExists && savedAquariumId) {
            setSelectedAquariumId(savedAquariumId);
          } else {
            // Default to first aquarium
            setSelectedAquariumId(response.data[0].id);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load aquariums");
        console.error("Error loading aquariums:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAquariums();
  }, []);

  // Load measurements and optimal values when aquarium changes
  useEffect(() => {
    if (!selectedAquariumId) {
      setMeasurements([]);
      setOptimalValues([]);
      setParameters([]);
      setLastMeasurementTime(null);
      return;
    }

    async function loadData() {
      try {
        setIsLoadingMeasurements(true);
        setError(null);

        // Find selected aquarium to get its type
        const selectedAquarium = aquariums.find((a) => a.id === selectedAquariumId);
        if (!selectedAquarium) {
          throw new Error("Selected aquarium not found");
        }

        // Fetch measurements and optimal values in parallel
        const [measurementsResponse, optimalValuesResponse] = await Promise.all([
          dashboardAPI.getLatestMeasurements(selectedAquariumId),
          dashboardAPI.getOptimalValues(selectedAquarium.aquarium_type_id),
        ]);

        setMeasurements(measurementsResponse.data);
        setOptimalValues(optimalValuesResponse.data);

        // Find the most recent measurement time
        if (measurementsResponse.data.length > 0) {
          const mostRecent = measurementsResponse.data.reduce((latest, current) =>
            new Date(current.measurement_time) > new Date(latest.measurement_time) ? current : latest
          );
          setLastMeasurementTime(mostRecent.measurement_time);
        } else {
          setLastMeasurementTime(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        console.error("Error loading data:", err);
      } finally {
        setIsLoadingMeasurements(false);
      }
    }

    loadData();
  }, [selectedAquariumId, aquariums]);

  // Calculate parameter statuses when measurements or optimal values change
  useEffect(() => {
    if (optimalValues.length === 0) {
      setParameters([]);
      return;
    }

    // Create a map of parameter measurements for quick lookup
    const measurementMap = new Map(measurements.map((m) => [m.parameter_id, m]));

    // Combine optimal values with measurements
    const parameterStatuses: ParameterStatusViewModel[] = optimalValues.map((optimal) => {
      const measurement = measurementMap.get(optimal.parameter_id);
      const currentValue = measurement?.value ?? null;

      // Calculate status
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
    });

    // Sort by status priority (critical > warning > normal > no_data)
    const statusPriority = { critical: 0, warning: 1, normal: 2, no_data: 3 };
    parameterStatuses.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

    setParameters(parameterStatuses);
  }, [measurements, optimalValues]);

  // Handle aquarium selection change
  const handleAquariumChange = useCallback((id: string) => {
    setSelectedAquariumId(id);
    localStorage.setItem(SELECTED_AQUARIUM_KEY, id);
    setIsDrawerOpen(false); // Close drawer when changing aquarium
  }, []);

  // Handle parameter card click
  const handleParameterClick = useCallback((id: string) => {
    setSelectedParameterId(id);
    setIsDrawerOpen(true);
  }, []);

  // Handle drawer close
  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedParameterId(null);
  }, []);

  // Refresh measurements
  const refreshMeasurements = useCallback(async () => {
    if (!selectedAquariumId) return;

    try {
      const response = await dashboardAPI.getLatestMeasurements(selectedAquariumId);
      setMeasurements(response.data);

      if (response.data.length > 0) {
        const mostRecent = response.data.reduce((latest, current) =>
          new Date(current.measurement_time) > new Date(latest.measurement_time) ? current : latest
        );
        setLastMeasurementTime(mostRecent.measurement_time);
      }
    } catch (err) {
      console.error("Error refreshing measurements:", err);
    }
  }, [selectedAquariumId]);

  // Get selected parameter
  const selectedParameter = selectedParameterId
    ? (parameters.find((p) => p.parameterId === selectedParameterId) ?? null)
    : null;

  return {
    aquariums,
    selectedAquariumId,
    parameters,
    lastMeasurementTime,
    isLoading,
    isLoadingMeasurements,
    error,
    selectedParameter,
    isDrawerOpen,
    handleAquariumChange,
    handleParameterClick,
    handleDrawerClose,
    refreshMeasurements,
  };
}
