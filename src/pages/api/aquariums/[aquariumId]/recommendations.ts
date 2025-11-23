/**
 * AI Recommendations Endpoint
 *
 * POST /api/aquariums/:aquariumId/recommendations
 *
 * Generates AI-powered recommendations for parameter deviations in a user's aquarium.
 * Requires authentication and aquarium ownership verification.
 */

import type { APIContext } from "astro";
import type { GetRecommendationsCommand, RecommendationResponseDTO, ErrorResponseDTO } from "@/types";
import { getRecommendationsSchema } from "@/lib/validation/recommendation.validation";
import {
  calculateDeviation,
  determineStatus,
  generateRecommendations,
  fetchParameterDetails,
  fetchAquariumWithType,
  AI_DISCLAIMER,
  type AIRecommendationContext,
} from "@/lib/services/ai-recommendations.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { calculateStatus } from "@/lib/utils/parameter-status.ts";

export const prerender = false;

/**
 * POST /api/aquariums/:aquariumId/recommendations
 *
 * Generate AI recommendations for a parameter deviation
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Step 1: Extract user from context.locals (set by middleware)
    const user = DEFAULT_USER_ID;

    // Step 2: Validate authentication
    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Get aquariumId from URL parameters
    const { aquariumId } = context.params;

    if (!aquariumId) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Aquarium ID is required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Validate aquariumId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(aquariumId)) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid aquarium ID format",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Parse and validate request body
    let requestBody: GetRecommendationsCommand;
    try {
      const rawBody = await context.request.json();
      const validationResult = getRecommendationsSchema.safeParse(rawBody);

      if (!validationResult.success) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: validationResult.error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      requestBody = validationResult.data;
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON in request body",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 6: Get Supabase client from context.locals
    const supabase = context.locals.supabase;

    // Step 7: Query aquarium with type and verify existence
    const aquarium = await fetchAquariumWithType(supabase, aquariumId);

    if (!aquarium) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "NOT_FOUND",
          message: "Aquarium not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 8: Verify ownership
    if (aquarium.user_id !== user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this aquarium",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 9: Query parameter details
    const parameter = await fetchParameterDetails(supabase, requestBody.parameter_id);

    if (!parameter) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "NOT_FOUND",
          message: "Parameter not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 10: Calculate deviation and status
    const deviationStatus = calculateStatus(
      requestBody.current_value,
      requestBody.optimal_min,
      requestBody.optimal_max
    );

    const status = deviationStatus.status;

    // Step 11: Generate AI recommendations (only if not normal)
    let analysis = "";
    let recommendations: string[] = [];

    if (status !== "normal") {
      try {
        // Build context for AI
        const aquariumTypeName =
          aquarium.aquarium_type && typeof aquarium.aquarium_type === "object" && "name" in aquarium.aquarium_type
            ? (aquarium.aquarium_type.name as string)
            : "Unknown";

        const aiContext: AIRecommendationContext = {
          aquariumType: aquariumTypeName,
          parameterName: parameter.name,
          parameterFullName: parameter.full_name,
          parameterUnit: parameter.unit,
          currentValue: requestBody.current_value,
          optimalMin: requestBody.optimal_min,
          optimalMax: requestBody.optimal_max,
          deviationPercentage: deviationStatus.deviationPercentage,
          status: status as "warning" | "critical",
        };

        const aiResponse = await generateRecommendations(aiContext);
        analysis = aiResponse.analysis;
        recommendations = aiResponse.recommendations;
      } catch (error) {
        // Log error for debugging (allowed in API endpoints)
        // eslint-disable-next-line no-console
        console.error("AI service error:", error);

        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "AI_SERVICE_UNAVAILABLE",
            message:
              "AI recommendation service is temporarily unavailable [" + error.message + "]. Please try again later.",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // Normal values don't need AI recommendations
      analysis = `Your ${parameter.full_name} level is within the optimal range for your aquarium.`;
      recommendations = ["Continue regular testing and maintenance to keep parameters stable."];
    }

    // Step 12: Construct response
    const response: RecommendationResponseDTO = {
      data: {
        parameter: {
          id: parameter.id,
          name: parameter.name,
          full_name: parameter.full_name,
          unit: parameter.unit,
        },
        current_value: requestBody.current_value,
        optimal_range: {
          min: requestBody.optimal_min,
          max: requestBody.optimal_max,
        },
        deviation_percentage: deviationStatus.deviationPercentage,
        status,
        analysis,
        recommendations,
        disclaimer: AI_DISCLAIMER,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 13: Handle unexpected errors
    // Log error for debugging (allowed in API endpoints)
    // eslint-disable-next-line no-console
    console.error("Unexpected error in recommendations endpoint:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
