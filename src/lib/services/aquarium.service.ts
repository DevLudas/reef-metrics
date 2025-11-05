import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateAquariumCommand, AquariumEntity } from "@/types";

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
}
