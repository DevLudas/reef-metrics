import { z } from "zod";

/**
 * Validation schema for a single measurement item in bulk creation
 */
export const bulkMeasurementItemSchema = z.object({
  parameter_id: z.string().uuid("Invalid parameter ID"),
  value: z.number().min(0, "Value must be non-negative"),
  notes: z.string().optional(),
});

/**
 * Validation schema for bulk measurement creation command
 */
export const bulkCreateMeasurementsSchema = z.object({
  measurement_time: z.string().datetime("Invalid datetime format").optional(),
  measurements: z.array(bulkMeasurementItemSchema).min(1, "At least one measurement is required"),
});

export type BulkMeasurementItemInput = z.infer<typeof bulkMeasurementItemSchema>;
export type BulkCreateMeasurementsInput = z.infer<typeof bulkCreateMeasurementsSchema>;
