import { z } from "zod";

// Schema for validating UUID path parameters
export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
});

// Schema for validating catch-all aquarium type ID parameters
export const aquariumTypeIdParamSchema = z.object({
  aquariumTypeId: z.string().uuid("Invalid aquarium type ID format"),
});

// Schema for validating default optimal values query parameters
export const defaultOptimalValuesQuerySchema = z.object({
  aquarium_type_id: z.string().uuid("Invalid aquarium type ID format").optional(),
  parameter_id: z.string().uuid("Invalid parameter ID format").optional(),
});
