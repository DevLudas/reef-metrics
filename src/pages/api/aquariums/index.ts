import type { APIRoute } from "astro";
import { z } from "zod";
import { AquariumService } from "@/lib/services/aquarium.service";
import { errorResponse } from "@/lib/utils";
import type { CreateAquariumCommand, CreateAquariumResponseDTO, AquariumsListResponseDTO } from "@/types";

export const prerender = false;

const createAquariumSchema = z.object({
  name: z.string().min(1, "Name is required and must not be empty"),
  aquarium_type_id: z.string().uuid("Invalid aquarium type ID format"),
  description: z.string().optional(),
  volume: z.number().positive("Volume must be a positive number").optional(),
});

const listQuerySchema = z.object({
  sort: z.enum(["name", "created_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get authenticated user
    const user = locals.user;
    if (!user) {
      return errorResponse("UNAUTHORIZED", "User not authenticated", 401);
    }

    // Step 2: Validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
    };
    const validation = listQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid query parameters",
        400,
        validation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))
      );
    }

    const { sort, order } = validation.data;

    // Step 3: Call service.listAquariums()
    const aquariumService = new AquariumService(locals.supabase);
    const aquariums = await aquariumService.listAquariums(user.id, sort, order);

    // Step 4: Return 200 with AquariumsListResponseDTO
    return new Response(
      JSON.stringify({
        data: aquariums,
      } as AquariumsListResponseDTO),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred", 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get authenticated user
    const user = locals.user;
    if (!user) {
      return errorResponse("UNAUTHORIZED", "User not authenticated", 401);
    }

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validation = createAquariumSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid input data",
        400,
        validation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))
      );
    }

    const command: CreateAquariumCommand = validation.data;

    // Step 3: Create aquarium via service
    const aquariumService = new AquariumService(locals.supabase);
    const aquarium = await aquariumService.createAquarium(user.id, command);

    // Step 4: Return success response
    return new Response(
      JSON.stringify({
        data: aquarium,
      } as CreateAquariumResponseDTO),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle service-level errors
    if (error instanceof Error) {
      switch (error.message) {
        case "AQUARIUM_TYPE_NOT_FOUND":
          return errorResponse("NOT_FOUND", "Aquarium type not found", 404);
        case "DUPLICATE_AQUARIUM_NAME":
          return errorResponse("CONFLICT", "An aquarium with this name already exists", 409);
      }
    }

    // Log unexpected errors
  }
};
