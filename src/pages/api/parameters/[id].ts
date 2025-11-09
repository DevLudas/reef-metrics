import type { APIRoute } from "astro";
import { ReferenceDataService } from "@/lib/services/reference-data.service";
import { uuidParamSchema } from "@/lib/validation/reference-data.validation";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
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

    const { data: user } = await supabaseClient.auth.getUser();
    if (!user.user) {
      return new Response(
        JSON.stringify({
          error: { code: "UNAUTHORIZED", message: "Invalid authentication" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate path parameters
    const paramValidation = uuidParamSchema.safeParse(params);
    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid parameters",
            details: paramValidation.error.issues,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const referenceDataService = new ReferenceDataService(supabaseClient);
    const parameter = await referenceDataService.getParameter(paramValidation.data.id);

    return new Response(JSON.stringify({ data: parameter }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("GET /api/parameters/[id] error:", error);

    const err = error as Error;
    if (err.message === "NOT_FOUND") {
      return new Response(
        JSON.stringify({
          error: { code: "NOT_FOUND", message: "Parameter not found" },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
