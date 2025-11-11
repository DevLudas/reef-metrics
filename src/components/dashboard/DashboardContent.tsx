import { useState, useCallback } from "react";
import type { AquariumListItemDTO, ParameterStatusViewModel } from "@/types";
import { DashboardHeader } from "./DashboardHeader";
import { NoAquariumsEmptyState } from "./NoAquariumsEmptyState";
import { NoMeasurementsEmptyState } from "./NoMeasurementsEmptyState";
import { ParameterCardsGrid } from "./ParameterCardsGrid";
import { AIRecommendationDrawer } from "./AIRecommendationDrawer";

export interface DashboardContentProps {
  aquariums: AquariumListItemDTO[];
  selectedAquariumId: string | null;
  parameters: ParameterStatusViewModel[];
  lastMeasurementTime: string | null;
}

/**
 * Main dashboard content component
 * Displays dashboard data passed from server-side rendering
 * Handles client-side interactivity (drawer, navigation)
 */
export function DashboardContent({
  aquariums,
  selectedAquariumId,
  parameters,
  lastMeasurementTime,
}: DashboardContentProps) {
  // UI state for drawer
  const [selectedParameterId, setSelectedParameterId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Handle add aquarium navigation
  const handleAddAquarium = () => {
    window.location.href = "/aquariums/new";
  };

  // Handle add measurement
  const handleAddMeasurement = () => {
    // TODO: Open measurement form modal
    // Implementation will be added when measurement form component is created
  };

  // Handle aquarium selection change
  const handleAquariumChange = useCallback((id: string) => {
    // Navigate to same page with aquarium parameter
    const url = new URL(window.location.href);
    url.searchParams.set("aquarium", id);
    window.location.href = url.toString();
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

  // Find selected parameter for drawer
  const selectedParameter = selectedParameterId
    ? parameters.find((p) => p.parameterId === selectedParameterId) || null
    : null;

  // No aquariums state
  if (aquariums.length === 0) {
    return <NoAquariumsEmptyState onAddAquarium={handleAddAquarium} />;
  }

  // Get selected aquarium name for empty state
  const selectedAquarium = aquariums.find((a) => a.id === selectedAquariumId);
  const aquariumName = selectedAquarium?.name || "this aquarium";

  // No measurements state
  if (parameters.length === 0) {
    return (
      <>
        <DashboardHeader
          aquariums={aquariums}
          selectedAquariumId={selectedAquariumId}
          lastMeasurementTime={lastMeasurementTime}
          onAquariumChange={handleAquariumChange}
          onAddMeasurement={handleAddMeasurement}
        />
        <NoMeasurementsEmptyState aquariumName={aquariumName} onAddMeasurement={handleAddMeasurement} />
      </>
    );
  }

  // Main dashboard view with parameter cards
  return (
    <>
      <DashboardHeader
        aquariums={aquariums}
        selectedAquariumId={selectedAquariumId}
        lastMeasurementTime={lastMeasurementTime}
        onAquariumChange={handleAquariumChange}
        onAddMeasurement={handleAddMeasurement}
      />

      <ParameterCardsGrid parameters={parameters} onParameterClick={handleParameterClick} />

      <AIRecommendationDrawer
        isOpen={isDrawerOpen}
        parameter={selectedParameter}
        aquariumId={selectedAquariumId}
        onClose={handleDrawerClose}
      />
    </>
  );
}
