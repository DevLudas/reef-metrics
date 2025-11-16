import { useEffect, useState } from "react";
import type { ParameterStatusViewModel, RecommendationDTO } from "@/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { dashboardAPI } from "@/lib/api/dashboard.api";
import { getStatusBgColor, getStatusLabel } from "@/lib/utils/parameter-status";

interface AIRecommendationDrawerProps {
  isOpen: boolean;
  parameter: ParameterStatusViewModel | null;
  aquariumId: string | null;
  onClose: () => void;
}

/**
 * Slide-out drawer displaying AI-generated analysis and recommendations
 * Appears from the right side with focus trapping and keyboard support
 */
export function AIRecommendationDrawer({ isOpen, parameter, aquariumId, onClose }: AIRecommendationDrawerProps) {
  const [recommendation, setRecommendation] = useState<RecommendationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recommendations when drawer opens
  useEffect(() => {
    if (!isOpen || !parameter || !aquariumId || parameter.currentValue === null) {
      setRecommendation(null);
      setError(null);
      return;
    }

    // Don't fetch for no_data status
    if (parameter.status === "no_data") {
      setRecommendation(null);
      setError(null);
      return;
    }

    async function fetchRecommendations() {
      if (!parameter || !aquariumId || parameter.currentValue === null) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await dashboardAPI.getRecommendations(aquariumId, {
          parameter_id: parameter.parameterId,
          current_value: parameter.currentValue,
          optimal_min: parameter.optimalMin,
          optimal_max: parameter.optimalMax,
        });

        setRecommendation(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recommendations");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
  }, [isOpen, parameter, aquariumId]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!parameter) return null;

  const statusBgColor = getStatusBgColor(parameter.status);
  const statusLabel = getStatusLabel(parameter.status);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-2xl">{parameter.fullName}</SheetTitle>
          <SheetDescription>AI-powered analysis and recommendations</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Parameter Status */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Current Status</h3>
              <div className={`rounded-full px-2 py-1 text-xs font-medium ${statusBgColor}`}>{statusLabel}</div>
            </div>

            {/* Current Value */}
            <div className="mb-2">
              <p className="text-xs text-gray-500">Current Value</p>
              {parameter.currentValue !== null ? (
                <p className="text-xl font-bold">
                  {parameter.currentValue} <span className="text-sm font-normal">{parameter.unit}</span>
                </p>
              ) : (
                <p className="text-xl font-bold text-gray-400">No data</p>
              )}
            </div>

            {/* Optimal Range */}
            <div>
              <p className="text-xs text-gray-500">Optimal Range</p>
              <p className="text-sm font-medium">
                {parameter.optimalMin} - {parameter.optimalMax} {parameter.unit}
              </p>
            </div>

            {/* Deviation */}
            {parameter.deviationPercentage !== null && parameter.deviationPercentage > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Deviation</p>
                <p className="text-sm font-medium">{parameter.deviationPercentage.toFixed(1)}% outside optimal range</p>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200"></div>
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-gray-200"></div>
                <div className="h-3 w-full animate-pulse rounded bg-gray-200"></div>
                <div className="h-3 w-4/5 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800">Error</h4>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {recommendation && !isLoading && (
            <>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Analysis</h3>
                <p className="text-sm leading-relaxed text-gray-700">{recommendation.analysis}</p>
              </div>

              {/* Recommendations */}
              {recommendation.recommendations.length > 0 && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Recommendations</h3>
                  <ul className="space-y-2">
                    {recommendation.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg
                          className="mt-1 h-4 w-4 flex-shrink-0 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">Disclaimer</h4>
                    <p className="mt-1 text-xs text-amber-700">{recommendation.disclaimer}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* No Data State */}
          {parameter.status === "no_data" && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-600">
                No measurements available for this parameter. Add a measurement to get AI recommendations.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
