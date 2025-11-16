import { z } from "zod";
import type { APIRoute } from "astro";
import { MeasurementsService } from "@/lib/services/measurements.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

// Zod schemas for validation
const updateMeasurementBodySchema = z.object({
  value: z.number().min(0).optional(),
  measurement_time: z.string().datetime().optional(),
  notes: z.string().optional(),
});

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

    const userId = DEFAULT_USER_ID;
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: { code: "UNAUTHORIZED", message: "Invalid authentication" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const measurementsService = new MeasurementsService(supabaseClient);
    const measurementId = params.id;

    if (!measurementId) {
      return new Response(
        JSON.stringify({
          error: { code: "BAD_REQUEST", message: "Measurement ID is required" },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // GET /api/measurements/:id
    const measurement = await measurementsService.getMeasurement(userId, measurementId);

    return new Response(JSON.stringify({ data: measurement }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {

    const err = error as Error;
    if (err.message === "NOT_FOUND") {
      return new Response(
        JSON.stringify({
          error: { code: "NOT_FOUND", message: "Measurement not found or access denied" },
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

export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

    const userId = DEFAULT_USER_ID;
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: { code: "UNAUTHORIZED", message: "Invalid authentication" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const measurementsService = new MeasurementsService(supabaseClient);
    const measurementId = params.id;

    if (!measurementId) {
      return new Response(
        JSON.stringify({
          error: { code: "BAD_REQUEST", message: "Measurement ID is required" },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // PATCH /api/measurements/:id
    const body = await request.json();
    const validation = updateMeasurementBodySchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: validation.error.issues,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const measurement = await measurementsService.updateMeasurement(userId, measurementId, validation.data);

    return new Response(JSON.stringify({ data: measurement }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {

    const err = error as Error;
    if (err.message === "NOT_FOUND") {
      return new Response(
        JSON.stringify({
          error: { code: "NOT_FOUND", message: "Measurement not found or access denied" },
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

export const DELETE: APIRoute = async ({ params, locals }) => {
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

    const userId = DEFAULT_USER_ID;
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: { code: "UNAUTHORIZED", message: "Invalid authentication" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const measurementsService = new MeasurementsService(supabaseClient);
    const measurementId = params.id;

    if (!measurementId) {
      return new Response(
        JSON.stringify({
          error: { code: "BAD_REQUEST", message: "Measurement ID is required" },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // DELETE /api/measurements/:id
    await measurementsService.deleteMeasurement(userId, measurementId);

    return new Response(null, { status: 204 });
  } catch (error: unknown) {

    const err = error as Error;
    if (err.message === "NOT_FOUND") {
      return new Response(
        JSON.stringify({
          error: { code: "NOT_FOUND", message: "Measurement not found or access denied" },
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
