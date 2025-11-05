import type { APIRoute } from "astro";
import { z } from "zod";
import { AquariumService } from "@/lib/services/aquarium.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { errorResponse } from "@/lib/utils";
import type { UpdateAquariumCommand, AquariumResponseDTO, UpdateAquariumResponseDTO } from "@/types";

export const prerender = false;

const uuidSchema = z.string().uuid("Invalid aquarium ID format");

const updateAquariumSchema = z
  .object({
    name: z.string().min(1, "Name must not be empty").optional(),
    aquarium_type_id: z.string().uuid("Invalid aquarium type ID").optional(),
    description: z.string().optional(),
    volume: z.number().positive("Volume must be positive").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Validate params.id
    const validation = uuidSchema.safeParse(params.id);
    if (!validation.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid aquarium ID format", 400);
    }

    const aquariumId = validation.data;

    // Step 2: Get user ID
    const userId = DEFAULT_USER_ID;

    // Step 3: Call service.getAquarium()
    const aquariumService = new AquariumService(locals.supabase);
    const aquarium = await aquariumService.getAquarium(userId, aquariumId);

    // Step 4: Return 200 with AquariumResponseDTO
    return new Response(
      JSON.stringify({
        data: aquarium,
      } as AquariumResponseDTO),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle service-level errors
    if (error instanceof Error) {
      switch (error.message) {
        case "NOT_FOUND":
          return errorResponse("NOT_FOUND", "Aquarium not found", 404);
      }
    }

    // Log unexpected errors
    console.error("Error getting aquarium:", error);

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Validate params.id
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid aquarium ID format", 400);
    }

    const aquariumId = idValidation.data;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const bodyValidation = updateAquariumSchema.safeParse(body);

    if (!bodyValidation.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid input data",
        400,
        bodyValidation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))
      );
    }

    const command: UpdateAquariumCommand = bodyValidation.data;

    // Step 3: Get user ID
    const userId = DEFAULT_USER_ID;

    // Step 4: Call service.updateAquarium()
    const aquariumService = new AquariumService(locals.supabase);
    const aquarium = await aquariumService.updateAquarium(userId, aquariumId, command);

    // Step 5: Return 200 with UpdateAquariumResponseDTO
    return new Response(
      JSON.stringify({
        data: aquarium,
      } as UpdateAquariumResponseDTO),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle service-level errors
    if (error instanceof Error) {
      switch (error.message) {
        case "NOT_FOUND":
          return errorResponse("NOT_FOUND", "Aquarium not found", 404);
        case "AQUARIUM_TYPE_NOT_FOUND":
          return errorResponse("NOT_FOUND", "Aquarium type not found", 404);
        case "DUPLICATE_AQUARIUM_NAME":
          return errorResponse("CONFLICT", "An aquarium with this name already exists", 409);
      }
    }

    // Log unexpected errors
    console.error("Error updating aquarium:", error);

    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred", 500);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Validate params.id
    const validation = uuidSchema.safeParse(params.id);
    if (!validation.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid aquarium ID format", 400);
    }

    const aquariumId = validation.data;

    // Step 2: Get user ID
    const userId = DEFAULT_USER_ID;

    // Step 3: Call service.deleteAquarium()
    const aquariumService = new AquariumService(locals.supabase);
    await aquariumService.deleteAquarium(userId, aquariumId);

    // Step 4: Return 204 No Content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle service-level errors
    if (error instanceof Error) {
      switch (error.message) {
        case "NOT_FOUND":
          return errorResponse("NOT_FOUND", "Aquarium not found", 404);
      }
    }

    // Log unexpected errors
    console.error("Error deleting aquarium:", error);

    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred", 500);
  }
};
