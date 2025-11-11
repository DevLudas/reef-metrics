import type { ParameterStatusViewModel } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { getStatusColor, getStatusBgColor, getStatusLabel, formatRelativeTime } from "@/lib/utils/parameter-status";

interface ParameterCardProps {
  parameter: ParameterStatusViewModel;
  onClick: () => void;
}

/**
 * Parameter card component displaying current value, optimal range, and status
 * Clickable card that opens AI recommendation drawer
 */
export function ParameterCard({ parameter, onClick }: ParameterCardProps) {
  const statusColor = getStatusColor(parameter.status);
  const statusBgColor = getStatusBgColor(parameter.status);
  const statusLabel = getStatusLabel(parameter.status);

  return (
    <Card
      className={`cursor-pointer border-2 transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${statusColor}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${parameter.fullName}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500">{parameter.name}</h3>
            <p className="text-xs text-gray-400">{parameter.fullName}</p>
          </div>
          <div className={`rounded-full px-2 py-1 text-xs font-medium ${statusBgColor}`}>{statusLabel}</div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Current Value */}
        <div className="mb-3">
          <p className="text-sm text-gray-500">Current Value</p>
          {parameter.currentValue !== null ? (
            <p className="text-2xl font-bold">
              {parameter.currentValue} <span className="text-sm font-normal">{parameter.unit}</span>
            </p>
          ) : (
            <p className="text-2xl font-bold text-gray-400">No data</p>
          )}
        </div>

        {/* Optimal Range */}
        <div className="mb-2">
          <p className="text-sm text-gray-500">Optimal Range</p>
          <p className="text-sm font-medium">
            {parameter.optimalMin} - {parameter.optimalMax} {parameter.unit}
          </p>
        </div>

        {/* Deviation Percentage */}
        {parameter.deviationPercentage !== null && parameter.deviationPercentage > 0 && (
          <div className="mt-2">
            <p className="text-sm">
              <span className="font-medium text-gray-700">Deviation:</span>{" "}
              <span className={statusColor}>{parameter.deviationPercentage.toFixed(1)}%</span>
            </p>
          </div>
        )}

        {/* Status Icon */}
        {parameter.status !== "no_data" && (
          <div className="mt-3 flex items-center gap-2">
            {parameter.status === "normal" && (
              <div className="flex items-center gap-1 text-green-600">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-medium">Within range</span>
              </div>
            )}
            {parameter.status === "warning" && (
              <div className="flex items-center gap-1 text-orange-600">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-medium">Needs attention</span>
              </div>
            )}
            {parameter.status === "critical" && (
              <div className="flex items-center gap-1 text-red-600">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-medium">Critical</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {parameter.measurementTime ? (
          <p className="text-xs text-gray-400">Last measured: {formatRelativeTime(parameter.measurementTime)}</p>
        ) : (
          <p className="text-xs text-gray-400">No measurements recorded</p>
        )}
      </CardFooter>
    </Card>
  );
}
