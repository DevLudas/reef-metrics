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

    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: { code: "UNAUTHORIZED", message: "User not authenticated" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const referenceDataService = new ReferenceDataService(supabaseClient);
    const aquariumTypes = await referenceDataService.getAquariumTypes();

    return new Response(JSON.stringify({ data: aquariumTypes }), {
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
