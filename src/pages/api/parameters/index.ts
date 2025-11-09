import type { APIRoute } from "astro";
import { ReferenceDataService } from "@/lib/services/reference-data.service";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
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

    const referenceDataService = new ReferenceDataService(supabaseClient);
    const parameters = await referenceDataService.getParameters();

    return new Response(JSON.stringify({ data: parameters }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("GET /api/parameters error:", error);

    return new Response(
      JSON.stringify({
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
