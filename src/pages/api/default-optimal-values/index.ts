import type { APIRoute } from "astro";
import { ReferenceDataService } from "@/lib/services/reference-data.service";
import { defaultOptimalValuesQuerySchema } from "@/lib/validation/reference-data.validation";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const supabaseClient = locals.supabase;
    if (!supabaseClient) {
      return new Response(
        JSON.stringify({
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: { code: "UNAUTHORIZED", message: "User not authenticated" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate query parameters
    const queryParams = Object.fromEntries(url.searchParams);
    const queryValidation = defaultOptimalValuesQuerySchema.safeParse(queryParams);
    if (!queryValidation.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: queryValidation.error.issues,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const referenceDataService = new ReferenceDataService(supabaseClient);
    const optimalValues = await referenceDataService.getDefaultOptimalValues(queryValidation.data);

    return new Response(JSON.stringify({ data: optimalValues }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
