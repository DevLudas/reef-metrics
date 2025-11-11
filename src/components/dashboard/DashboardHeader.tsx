import type { AquariumListItemDTO } from "@/types";
import { AquariumSelector } from "./AquariumSelector";
import { AddMeasurementButton } from "./AddMeasurementButton";
import { formatRelativeTime } from "@/lib/utils/parameter-status";

interface DashboardHeaderProps {
  aquariums: AquariumListItemDTO[];
  selectedAquariumId: string | null;
  lastMeasurementTime: string | null;
  onAquariumChange: (aquariumId: string) => void;
  onAddMeasurement: () => void;
}

/**
 * Dashboard header containing aquarium selector and action buttons
 * Displays last measurement time and provides quick access to add measurements
 */
export function DashboardHeader({
  aquariums,
  selectedAquariumId,
  lastMeasurementTime,
  onAquariumChange,
  onAddMeasurement,
}: DashboardHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Top row: Aquarium selector and action button */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* Aquarium Selector */}
        {aquariums.length > 0 && selectedAquariumId && (
          <AquariumSelector aquariums={aquariums} selectedId={selectedAquariumId} onChange={onAquariumChange} />
        )}

        {/* Add Measurement Button */}
        <AddMeasurementButton onClick={onAddMeasurement} disabled={!selectedAquariumId} />
      </div>

      {/* Last measurement time */}
      {lastMeasurementTime && (
        <div className="text-sm text-gray-600">
          Last measurement: <span className="font-medium">{formatRelativeTime(lastMeasurementTime)}</span>
        </div>
      )}
    </div>
  );
}
