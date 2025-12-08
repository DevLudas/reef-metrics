import { useState, useEffect } from "react";
import type { ParameterDTO, BulkCreateMeasurementsCommand } from "@/types";
import { dashboardAPI } from "@/lib/api/dashboard.api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MeasurementInput {
  parameter_id: string;
  value: string;
  notes: string;
}

interface AddMeasurementFormProps {
  isOpen: boolean;
  onClose: () => void;
  aquariumId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

/**
 * Form for adding new measurements for all parameters
 * Displays in a Sheet (slide-in panel) with inputs for each parameter
 */
export function AddMeasurementForm({ isOpen, onClose, aquariumId, onSuccess, onError }: AddMeasurementFormProps) {
  const [parameters, setParameters] = useState<ParameterDTO[]>([]);
  const [isLoadingParameters, setIsLoadingParameters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [measurementTime, setMeasurementTime] = useState<string>("");
  const [measurements, setMeasurements] = useState<Record<string, MeasurementInput>>({});

  // Initialize measurement time to current time
  useEffect(() => {
    const now = new Date();
    // Format for datetime-local input: YYYY-MM-DDThh:mm
    const formatted = now.toISOString().slice(0, 16);
    setMeasurementTime(formatted);
  }, [isOpen]);

  // Load parameters when form opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    async function loadParameters() {
      setIsLoadingParameters(true);

      try {
        const response = await dashboardAPI.getParameters();
        setParameters(response.data);

        // Initialize measurements state
        const initialMeasurements: Record<string, MeasurementInput> = {};
        response.data.forEach((param) => {
          initialMeasurements[param.id] = {
            parameter_id: param.id,
            value: "",
            notes: "",
          };
        });
        setMeasurements(initialMeasurements);
      } catch {
        onError("Failed to load parameters. Please try again.");
      } finally {
        setIsLoadingParameters(false);
      }
    }

    loadParameters();
  }, [isOpen, onError]);

  const handleValueChange = (parameterId: string, value: string) => {
    setMeasurements((prev) => ({
      ...prev,
      [parameterId]: {
        ...prev[parameterId],
        value,
      },
    }));
  };

  const handleNotesChange = (parameterId: string, notes: string) => {
    setMeasurements((prev) => ({
      ...prev,
      [parameterId]: {
        ...prev[parameterId],
        notes,
      },
    }));
  };

  const handleCancel = () => {
    // Reset form
    setMeasurementTime(new Date().toISOString().slice(0, 16));
    const resetMeasurements: Record<string, MeasurementInput> = {};
    parameters.forEach((param) => {
      resetMeasurements[param.id] = {
        parameter_id: param.id,
        value: "",
        notes: "",
      };
    });
    setMeasurements(resetMeasurements);
    onClose();
  };

  const handleSave = async () => {
    // Filter out empty measurements
    const filledMeasurements = Object.values(measurements).filter((m) => m.value.trim() !== "");

    // Guard clause: Validate at least one measurement (early return)
    if (filledMeasurements.length === 0) {
      onError("Please enter at least one measurement value.");
      return;
    }

    // Guard clause: Validate all values are numbers >= 0 (early return)
    const invalidValues = filledMeasurements.filter((m) => {
      const num = parseFloat(m.value);
      return isNaN(num) || num < 0;
    });

    if (invalidValues.length > 0) {
      onError("All measurement values must be valid non-negative numbers.");
      return;
    }

    // Happy path: Submit measurements
    setIsSubmitting(true);

    try {
      // Convert to API format
      const command: BulkCreateMeasurementsCommand = {
        measurement_time: new Date(measurementTime).toISOString(),
        measurements: filledMeasurements.map((m) => ({
          parameter_id: m.parameter_id,
          value: parseFloat(m.value),
          notes: m.notes.trim() || undefined,
        })),
      };

      // Submit to API
      await dashboardAPI.createBulkMeasurements(aquariumId, command);

      // Reset form
      handleCancel();

      // Notify success
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save measurements. Please try again.";
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Measurements</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Measurement Time */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="measurement-time">Measurement Time</Label>
            <Input
              id="measurement-time"
              type="datetime-local"
              value={measurementTime}
              onChange={(e) => setMeasurementTime(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Parameters */}
          {isLoadingParameters ? (
            <div className="text-sm text-muted-foreground">Loading parameters...</div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="text-sm font-medium">Parameters</div>
              {parameters.map((param) => (
                <div key={param.id} className="flex flex-col gap-3 rounded-lg border p-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`param-${param.id}`}>
                      {param.full_name} ({param.name})
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`param-${param.id}`}
                        type="number"
                        step="0.01"
                        placeholder="Enter value"
                        value={measurements[param.id]?.value || ""}
                        onChange={(e) => handleValueChange(param.id, e.target.value)}
                        disabled={isSubmitting}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground min-w-[60px]">{param.unit}</span>
                    </div>
                  </div>

                  {/* Individual notes per parameter */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`notes-${param.id}`} className="text-xs text-muted-foreground">
                      Notes (optional)
                    </Label>
                    <Textarea
                      id={`notes-${param.id}`}
                      placeholder="Add notes for this measurement..."
                      value={measurements[param.id]?.notes || ""}
                      onChange={(e) => handleNotesChange(param.id, e.target.value)}
                      disabled={isSubmitting}
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || isLoadingParameters}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
