import { useState } from "react";
import type { RecommendationResponseDTO, ErrorResponseDTO } from "@/types";
import { useToast } from "./useToast";

interface UseAIRecommendationsParams {
  aquariumId: string;
}

interface RecommendationRequest {
  parameter_id: string;
  current_value: number;
  optimal_min: number;
  optimal_max: number;
}

interface UseAIRecommendationsReturn {
  data: RecommendationResponseDTO["data"] | null;
  loading: boolean;
  error: string | null;
  fetchRecommendations: (request: RecommendationRequest) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for fetching AI recommendations for parameter deviations
 *
 * @param params - Hook parameters including aquariumId
 * @returns Object containing data, loading state, error, and fetch function
 *
 * @example
 * ```tsx
 * const { data, loading, error, fetchRecommendations } = useAIRecommendations({
 *   aquariumId: "123e4567-e89b-12d3-a456-426614174000"
 * });
 *
 * await fetchRecommendations({
 *   parameter_id: "param-uuid",
 *   current_value: 8.5,
 *   optimal_min: 7.8,
 *   optimal_max: 8.3
 * });
 * ```
 */
export function useAIRecommendations({ aquariumId }: UseAIRecommendationsParams): UseAIRecommendationsReturn {
  const [data, setData] = useState<RecommendationResponseDTO["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const fetchRecommendations = async (request: RecommendationRequest) => {
    // Reset previous state
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/aquariums/${aquariumId}/recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        const errorMessage = errorData.error?.message || "Failed to fetch recommendations";

        setError(errorMessage);
        showError("Error", errorMessage);
        return;
      }

      const result: RecommendationResponseDTO = await response.json();
      setData(result.data);

      // Show success toast for non-normal statuses
      if (result.data.status !== "normal") {
        success("Recommendations Generated", `AI analysis complete for ${result.data.parameter.full_name}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      showError("Error", "Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return {
    data,
    loading,
    error,
    fetchRecommendations,
    reset,
  };
}
