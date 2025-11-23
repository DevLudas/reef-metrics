/**
 * AI Recommendations Service
 *
 * Generates AI-powered recommendations for aquarium parameter deviations
 * using OpenRouter API with structured outputs.
 */

import type { SupabaseClient } from "@/db/supabase.client.ts";
import { OpenRouterService } from "./openrouter.service";

/**
 * Context for generating AI recommendations
 */
export interface AIRecommendationContext {
  aquariumType: string;
  parameterName: string;
  parameterFullName: string;
  parameterUnit: string;
  currentValue: number;
  optimalMin: number;
  optimalMax: number;
  deviationPercentage: number;
  status: "warning" | "critical";
}

/**
 * Structured AI response format
 */
export interface AIRecommendationResponse {
  analysis: string;
  recommendations: string[];
}

/**
 * Standard disclaimer text for all AI recommendations
 */
export const AI_DISCLAIMER =
  "These recommendations are AI-generated and should be used as guidance only. " +
  "Always research and verify before making changes to your aquarium. " +
  "Consult with experienced aquarists or professionals for critical situations.";

/**
 * Build the AI prompt for parameter recommendations
 */
function buildRecommendationPrompt(context: AIRecommendationContext): string {
  const direction = context.currentValue < context.optimalMin ? "below" : "above";

  return `Analyze the following parameter deviation for a ${context.aquariumType} aquarium:

Parameter: ${context.parameterFullName} (${context.parameterName})
Current Value: ${context.currentValue} ${context.parameterUnit}
Optimal Range: ${context.optimalMin}-${context.optimalMax} ${context.parameterUnit}
Deviation: ${context.deviationPercentage}% (${direction} optimal)
Status: ${context.status}

Provide a brief analysis (2-3 sentences) explaining what this deviation means and why it matters for the aquarium ecosystem.

Then provide 3-5 specific, actionable recommendations to correct this issue. Each recommendation should be:
- Practical and safe for the aquarium inhabitants
- Specific to marine aquariums
- Actionable (something the user can do)
- Ordered by priority (most important first)

Focus on immediate actions, testing procedures, and long-term prevention strategies.`;
}

/**
 * Response format schema for AI recommendations
 */
const RECOMMENDATION_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "parameter_recommendation",
    strict: true as const,
    schema: {
      type: "object" as const,
      properties: {
        analysis: {
          type: "string" as const,
          description: "Brief analysis of what the deviation means and why it matters",
        },
        recommendations: {
          type: "array" as const,
          items: {
            type: "string" as const,
          },
          description: "List of 3-5 specific actionable recommendations",
        },
      },
      required: ["analysis", "recommendations"],
      additionalProperties: false,
    },
  },
};

/**
 * Generate AI recommendations for a parameter deviation
 *
 * @param context - Context about the aquarium and parameter deviation
 * @returns AI-generated analysis and recommendations
 * @throws OpenRouterError if AI service fails
 */
export async function generateRecommendations(context: AIRecommendationContext): Promise<AIRecommendationResponse> {
  const openRouter = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);

  const systemMessage =
    "You are an expert marine aquarium advisor specializing in water chemistry and reef tank maintenance. " +
    "You have deep knowledge of marine biology, coral care, and aquarium parameter management. " +
    "Your advice is practical, safe, and based on established aquarium keeping best practices. " +
    "You provide clear, actionable guidance that helps aquarists maintain healthy reef ecosystems.";

  return await openRouter.createChatCompletion<AIRecommendationResponse>({
    systemMessage,
    userMessage: buildRecommendationPrompt(context),
    responseFormat: RECOMMENDATION_RESPONSE_FORMAT,
    model: import.meta.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-3.5-sonnet",
    modelParams: {
      temperature: 0.7,
      max_tokens: 1000,
    },
  });
}

/**
 * Fetch parameter details from database
 *
 * @param supabase - Supabase client
 * @param parameterId - UUID of the parameter
 * @returns Parameter details or null if not found
 */
export async function fetchParameterDetails(supabase: SupabaseClient, parameterId: string) {
  const { data, error } = await supabase
    .from("parameters")
    .select("id, name, full_name, unit")
    .eq("id", parameterId)
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching parameter:", error);
    return null;
  }

  return data;
}

/**
 * Fetch aquarium with type information
 *
 * @param supabase - Supabase client
 * @param aquariumId - UUID of the aquarium
 * @returns Aquarium with type or null if not found
 */
export async function fetchAquariumWithType(supabase: SupabaseClient, aquariumId: string) {
  const { data, error } = await supabase
    .from("aquariums")
    .select("id, user_id, aquarium_type:aquarium_types(name)")
    .eq("id", aquariumId)
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching aquarium:", error);
    return null;
  }

  return data;
}
