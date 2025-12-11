import { useState, useCallback } from "react";
import { DashboardAPI } from "@/lib/api/dashboard.api";
import type { AquariumListItemDTO } from "@/types";

export function useAquariums(initialAquariums: AquariumListItemDTO[]) {
  const [aquariums, setAquariums] = useState<AquariumListItemDTO[]>(initialAquariums);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dashboardAPI = useCallback(() => new DashboardAPI(), []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dashboardAPI().getAquariums();
      setAquariums(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch aquariums";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [dashboardAPI]);

  return { aquariums, isLoading, error, refetch };
}
