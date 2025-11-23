import { z } from "zod";

/**
 * Validation schema for AI recommendation requests
 * Validates that all required fields are present and properly formatted
 */
export const getRecommendationsSchema = z
  .object({
    parameter_id: z.string().uuid("Parameter ID must be a valid UUID"),
    current_value: z.number().positive("Current value must be positive"),
    optimal_min: z.number().gte(0, "Optimal minimum must be non-negative"),
    optimal_max: z.number().positive("Optimal maximum must be positive"),
  })
  .refine((data) => data.optimal_max > data.optimal_min, {
    message: "Optimal maximum must be greater than optimal minimum",
    path: ["optimal_max"],
  });
