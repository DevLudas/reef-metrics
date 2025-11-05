import type { APIRoute } from "astro";
import { z } from "zod";
import { AquariumService } from "@/lib/services/aquarium.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import type { CreateAquariumCommand, CreateAquariumResponseDTO, ErrorResponseDTO } from "@/types";

export const prerender = false;

const createAquariumSchema = z.object({
  name: z.string().min(1, "Name is required and must not be empty"),
  aquarium_type_id: z.string().uuid("Invalid aquarium type ID format"),
  description: z.string().optional(),
  volume: z.number().positive("Volume must be a positive number").optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Use default user ID (authentication removed for this stage)
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validation = createAquariumSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validation.error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command: CreateAquariumCommand = validation.data;

    // Step 3: Create aquarium via service
    const aquariumService = new AquariumService(locals.supabase);
    const aquarium = await aquariumService.createAquarium(userId, command);

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
      if (error.message === "AQUARIUM_TYPE_NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: {
              code: "NOT_FOUND",
              message: "Aquarium type not found",
            },
          } as ErrorResponseDTO),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "DUPLICATE_AQUARIUM_NAME") {
        return new Response(
          JSON.stringify({
            error: {
              code: "CONFLICT",
              message: "An aquarium with this name already exists",
            },
          } as ErrorResponseDTO),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Log unexpected errors
    console.error("Error creating aquarium:", error);

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
