import { z } from "zod";
import type { APIRoute } from "astro";
import { MeasurementsService } from "@/lib/services/measurements.service";

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

    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: { code: "UNAUTHORIZED", message: "User not authenticated" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const measurementsService = new MeasurementsService(supabaseClient);
    const pathSegments = (params.aquariumId ?? "").split("/");
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

    if (subPath === "" || subPath === undefined) {
      // GET /api/measurements/:aquariumId
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
        user.id,
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

    if (subPath === "latest") {
      // GET /api/measurements/:aquariumId/latest
      const measurements = await measurementsService.getLatestMeasurements(user.id, aquariumId);

      return new Response(JSON.stringify({ data: measurements }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (subPath.startsWith("by-date/")) {
      // GET /api/measurements/:aquariumId/by-date/:date
      const date = subPath.replace("by-date/", "");
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return new Response(
          JSON.stringify({
            error: { code: "BAD_REQUEST", message: "Invalid date format. Use YYYY-MM-DD" },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const measurements = await measurementsService.getMeasurementsByDate(user.id, aquariumId, date);

      return new Response(JSON.stringify({ data: measurements }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (subPath === "calendar") {
      // GET /api/measurements/:aquariumId/calendar
      const calendar = await measurementsService.getMeasurementCalendar(user.id, aquariumId);

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
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
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

    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: { code: "UNAUTHORIZED", message: "User not authenticated" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const measurementsService = new MeasurementsService(supabaseClient);
    const pathSegments = (params.aquariumId ?? "").split("/");
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

    if (subPath === "" || subPath === undefined) {
      // POST /api/measurements/:aquariumId
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

      const measurement = await measurementsService.createMeasurement(user.id, aquariumId, validation.data);

      return new Response(JSON.stringify({ data: measurement }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (subPath === "bulk") {
      // POST /api/measurements/:aquariumId/bulk
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

      const measurements = await measurementsService.bulkCreateMeasurements(user.id, aquariumId, validation.data);

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
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return new Response(
        JSON.stringify({
          error: { code: "NOT_FOUND", message: "Aquarium not found or access denied" },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof Error && error.message === "PARAMETER_NOT_FOUND") {
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
