import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateAquariumCommand,
  AquariumEntity,
  AquariumListItemDTO,
  AquariumDTO,
  UpdateAquariumCommand,
} from "@/types";

export class AquariumService {
  constructor(private supabase: SupabaseClient) {}

  async createAquarium(userId: string, command: CreateAquariumCommand): Promise<AquariumEntity> {
    // Validate aquarium type exists
    const { data: aquariumType, error: typeError } = await this.supabase
      .from("aquarium_types")
      .select("id")
      .eq("id", command.aquarium_type_id)
      .single();

    if (typeError || !aquariumType) {
      throw new Error("AQUARIUM_TYPE_NOT_FOUND");
    }

    // Insert aquarium
    const { data: aquarium, error: insertError } = await this.supabase
      .from("aquariums")
      .insert({
        user_id: userId,
        name: command.name,
        aquarium_type_id: command.aquarium_type_id,
        description: command.description,
        volume: command.volume,
      })
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation
      if (insertError.code === "23505") {
        throw new Error("DUPLICATE_AQUARIUM_NAME");
      }
      throw insertError;
    }

    return aquarium;
  }

  async listAquariums(
    userId: string,
    sort: "name" | "created_at" = "created_at",
    order: "asc" | "desc" = "desc"
  ): Promise<AquariumListItemDTO[]> {
    const { data: aquariums, error } = await this.supabase
      .from("aquariums")
      .select(
        `
        id,
        user_id,
        aquarium_type_id,
        name,
        description,
        volume,
        created_at,
        updated_at,
        aquarium_type:aquarium_types(id, name)
      `
      )
      .eq("user_id", userId)
      .order(sort, { ascending: order === "asc" });

    if (error) {
      throw error;
    }

    return aquariums || [];
  }

  async getAquarium(userId: string, aquariumId: string): Promise<AquariumDTO> {
    const { data: aquarium, error } = await this.supabase
      .from("aquariums")
      .select(
        `
        id,
        user_id,
        aquarium_type_id,
        name,
        description,
        volume,
        created_at,
        updated_at,
        aquarium_type:aquarium_types(id, name, description)
      `
      )
      .eq("id", aquariumId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("NOT_FOUND");
      }
      throw error;
    }

    if (!aquarium) {
      throw new Error("NOT_FOUND");
    }

    return aquarium;
  }

  async updateAquarium(userId: string, aquariumId: string, command: UpdateAquariumCommand): Promise<AquariumEntity> {
    // First check ownership and existence
    const { data: existingAquarium, error: checkError } = await this.supabase
      .from("aquariums")
      .select("id")
      .eq("id", aquariumId)
      .eq("user_id", userId)
      .single();

    if (checkError || !existingAquarium) {
      if (checkError?.code === "PGRST116") {
        throw new Error("NOT_FOUND");
      }
      throw checkError || new Error("NOT_FOUND");
    }

    // Validate aquarium type if being updated
    if (command.aquarium_type_id) {
      const { data: aquariumType, error: typeError } = await this.supabase
        .from("aquarium_types")
        .select("id")
        .eq("id", command.aquarium_type_id)
        .single();

      if (typeError || !aquariumType) {
        throw new Error("AQUARIUM_TYPE_NOT_FOUND");
      }
    }

    // Update aquarium
    const { data: aquarium, error: updateError } = await this.supabase
      .from("aquariums")
      .update({
        name: command.name,
        aquarium_type_id: command.aquarium_type_id,
        description: command.description,
        volume: command.volume,
      })
      .eq("id", aquariumId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      // Handle unique constraint violation
      if (updateError.code === "23505") {
        throw new Error("DUPLICATE_AQUARIUM_NAME");
      }
      throw updateError;
    }

    return aquarium;
  }

  async deleteAquarium(userId: string, aquariumId: string): Promise<void> {
    // First check ownership and existence
    const { data: existingAquarium, error: checkError } = await this.supabase
      .from("aquariums")
      .select("id")
      .eq("id", aquariumId)
      .eq("user_id", userId)
      .single();

    if (checkError || !existingAquarium) {
      if (checkError?.code === "PGRST116") {
        throw new Error("NOT_FOUND");
      }
      throw checkError || new Error("NOT_FOUND");
    }

    // Delete aquarium (cascade will handle measurements)
    const { error: deleteError } = await this.supabase
      .from("aquariums")
      .delete()
      .eq("id", aquariumId)
      .eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }
  }
}
