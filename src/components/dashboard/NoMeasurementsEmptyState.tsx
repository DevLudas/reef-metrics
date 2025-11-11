import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NoMeasurementsEmptyStateProps {
  aquariumName: string;
  onAddMeasurement: () => void;
}

/**
 * Empty state component shown when selected aquarium has no measurements
 * Encourages user to add their first measurement
 */
export function NoMeasurementsEmptyState({ aquariumName, onAddMeasurement }: NoMeasurementsEmptyStateProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {/* Icon */}
        <div className="mb-4 rounded-full bg-emerald-100 p-4">
          <svg
            className="h-12 w-12 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="mb-2 text-2xl font-bold text-gray-900">No Measurements Yet</h2>

        {/* Description */}
        <p className="mb-2 text-gray-600">
          Start tracking water parameters for <strong>{aquariumName}</strong>.
        </p>
        <p className="mb-6 text-sm text-gray-500">Add your first measurement to monitor the health of your reef.</p>

        {/* CTA Button */}
        <Button onClick={onAddMeasurement} size="lg" className="min-w-[200px]">
          Add Your First Measurement
        </Button>
      </CardContent>
    </Card>
  );
}
