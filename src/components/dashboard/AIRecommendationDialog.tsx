import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { RecommendationResponseDTO } from "@/types";

interface AIRecommendationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: RecommendationResponseDTO["data"] | null;
  loading: boolean;
  error: string | null;
}

/**
 * Dialog component for displaying AI-generated parameter recommendations
 *
 * Shows parameter details, deviation analysis, and actionable recommendations
 * for maintaining optimal aquarium water chemistry.
 */
export function AIRecommendationDialog({ open, onOpenChange, data, loading, error }: AIRecommendationDialogProps) {
  // Determine if value is above or below optimal
  const getDeviationDirection = () => {
    if (!data) return null;
    if (data.current_value < data.optimal_range.min) return "below";
    if (data.current_value > data.optimal_range.max) return "above";
    return "within";
  };

  const deviationDirection = getDeviationDirection();

  // Get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "normal":
        return "default";
      case "warning":
        return "secondary";
      case "critical":
        return "destructive";
      default:
        return "default";
    }
  };

  // Get deviation icon
  const DeviationIcon = () => {
    if (!data) return null;
    if (data.status === "normal") return <Sparkles className="h-5 w-5" />;
    if (deviationDirection === "above") return <TrendingUp className="h-5 w-5 text-orange-500" />;
    if (deviationDirection === "below") return <TrendingDown className="h-5 w-5 text-blue-500" />;
    return <AlertTriangle className="h-5 w-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Recommendations
          </DialogTitle>
          <DialogDescription>Expert advice for maintaining optimal water parameters</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
            <p className="mt-4 text-sm font-medium text-gray-700">Waiting for recommendations...</p>
          </div>
        )}

        {!loading && error && (
          <div className="space-y-4">
            {/* Error state */}
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-red-900">Unable to Load Recommendations</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            {/* Parameter Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Parameter</h3>
                <Badge variant={getStatusVariant(data.status)}>{data.status.toUpperCase()}</Badge>
              </div>
              <p className="text-xl font-semibold">{data.parameter.full_name}</p>
            </div>

            {/* Current Value */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Current Value</p>
                  <p className="text-2xl font-bold">
                    {data.current_value} {data.parameter.unit}
                  </p>
                </div>
                <DeviationIcon />
              </div>

              <div className="mt-3 space-y-1">
                <p className="text-sm text-gray-500">Optimal Range</p>
                <p className="text-sm font-medium">
                  {data.optimal_range.min} - {data.optimal_range.max} {data.parameter.unit}
                </p>
              </div>

              {data.status !== "normal" && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-white p-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <p className="text-sm">
                    <span className="font-medium">{Math.abs(data.deviation_percentage).toFixed(1)}%</span>{" "}
                    {deviationDirection} optimal range
                  </p>
                </div>
              )}
            </div>

            {/* Analysis */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Analysis</h4>
              <p className="text-sm leading-relaxed text-gray-700">{data.analysis}</p>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Recommended Actions</h4>
              <ol className="space-y-3">
                {data.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                      {index + 1}
                    </span>
                    <p className="flex-1 text-sm leading-relaxed text-gray-700">{recommendation}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Disclaimer */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900">Important Notice</p>
                  <p className="text-xs leading-relaxed text-amber-800">{data.disclaimer}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

