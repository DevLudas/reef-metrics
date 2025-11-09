import { z } from "zod";
import type { APIRoute } from "astro";
import { MeasurementsService } from "@/lib/services/measurements.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

// Zod schemas for validation
const getMeasurementsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  parameter_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["measurement_time", "created_at"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

const createMeasurementBodySchema = z.object({
  parameter_id: z.string().uuid(),
  value: z.number().min(0),
  measurement_time: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const bulkCreateMeasurementsBodySchema = z.object({
  measurement_time: z.string().datetime().optional(),
  measurements: z
    .array(
      z.object({
        parameter_id: z.string().uuid(),
        value: z.number().min(0),
        notes: z.string().optional(),
      })
    )
    .min(1),
});

export const prerender = false;

export const GET: APIRoute = async ({ params, url, locals }) => {
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
    const pathSegments = params.aquariumId.split("/");
    const aquariumId = pathSegments[0];

    if (!aquariumId) {
      return new Response(
        JSON.stringify({
          error: { code: "BAD_REQUEST", message: "Aquarium ID is required" },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const subPath = pathSegments.slice(1).join("/");

    if (subPath === "measurements") {
      // GET /api/aquariums/:aquariumId/measurements
      const queryParams = Object.fromEntries(url.searchParams);
      const validation = getMeasurementsQuerySchema.safeParse(queryParams);

      if (!validation.success) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid query parameters",
              details: validation.error.issues,
            },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const { measurements, total } = await measurementsService.getMeasurements(
        userId,
        aquariumId,
        {
          start_date: validation.data.start_date,
          end_date: validation.data.end_date,
          parameter_id: validation.data.parameter_id,
        },
        {
          limit: validation.data.limit,
          offset: validation.data.offset,
        },
        {
          sort: validation.data.sort,
          order: validation.data.order,
        }
      );

      return new Response(
        JSON.stringify({
          data: measurements,
          pagination: {
            total,
            limit: validation.data.limit || 50,
            offset: validation.data.offset || 0,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (subPath === "measurements/latest") {
      // GET /api/aquariums/:aquariumId/measurements/latest
      const measurements = await measurementsService.getLatestMeasurements(userId, aquariumId);

      return new Response(JSON.stringify({ data: measurements }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (subPath.startsWith("measurements/by-date/")) {
      // GET /api/aquariums/:aquariumId/measurements/by-date/:date
      const date = subPath.replace("measurements/by-date/", "");
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return new Response(
          JSON.stringify({
            error: { code: "BAD_REQUEST", message: "Invalid date format. Use YYYY-MM-DD" },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const measurements = await measurementsService.getMeasurementsByDate(userId, aquariumId, date);

      return new Response(JSON.stringify({ data: measurements }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (subPath === "measurements/calendar") {
      // GET /api/aquariums/:aquariumId/measurements/calendar
      const calendar = await measurementsService.getMeasurementCalendar(userId, aquariumId);

      return new Response(JSON.stringify({ data: calendar }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        error: { code: "NOT_FOUND", message: "Endpoint not found" },
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("GET /api/aquariums/[...aquariumId] error:", error);

    if (error.message === "NOT_FOUND") {
      return new Response(
        JSON.stringify({
          error: { code: "NOT_FOUND", message: "Aquarium not found or access denied" },
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

export const POST: APIRoute = async ({ params, request, locals }) => {
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
    const pathSegments = params.aquariumId.split("/");
    const aquariumId = pathSegments[0];

    if (!aquariumId) {
      return new Response(
        JSON.stringify({
          error: { code: "BAD_REQUEST", message: "Aquarium ID is required" },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const subPath = pathSegments.slice(1).join("/");

    if (subPath === "measurements") {
      // POST /api/aquariums/:aquariumId/measurements
      const body = await request.json();
      const validation = createMeasurementBodySchema.safeParse(body);

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

      const measurement = await measurementsService.createMeasurement(userId, aquariumId, validation.data);

      return new Response(JSON.stringify({ data: measurement }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (subPath === "measurements/bulk") {
      // POST /api/aquariums/:aquariumId/measurements/bulk
      const body = await request.json();
      const validation = bulkCreateMeasurementsBodySchema.safeParse(body);

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

      const measurements = await measurementsService.bulkCreateMeasurements(userId, aquariumId, validation.data);

      return new Response(JSON.stringify({ data: measurements }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        error: { code: "NOT_FOUND", message: "Endpoint not found" },
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("POST /api/aquariums/[...aquariumId] error:", error);

    if (error.message === "NOT_FOUND") {
      return new Response(
        JSON.stringify({
          error: { code: "NOT_FOUND", message: "Aquarium not found or access denied" },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error.message === "PARAMETER_NOT_FOUND") {
      return new Response(
        JSON.stringify({
          error: { code: "BAD_REQUEST", message: "Parameter not found" },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
