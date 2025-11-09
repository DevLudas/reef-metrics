import type { SupabaseClient } from "@/db/supabase.client";
import type {
  AquariumTypeDTO,
  ParameterDTO,
  DefaultOptimalValueDTO,
  DefaultOptimalValueWithParameterDTO,
} from "@/types";

export class ReferenceDataService {
  constructor(private supabase: SupabaseClient) {}

  async getAquariumTypes(): Promise<AquariumTypeDTO[]> {
    const { data: aquariumTypes, error } = await this.supabase
      .from("aquarium_types")
      .select("id, name, description, created_at")
      .order("name");

    if (error) {
      throw error;
    }

    return aquariumTypes || [];
  }

  async getAquariumType(id: string): Promise<AquariumTypeDTO> {
    const { data: aquariumType, error } = await this.supabase
      .from("aquarium_types")
      .select("id, name, description, created_at")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("NOT_FOUND");
      }
      throw error;
    }

    if (!aquariumType) {
      throw new Error("NOT_FOUND");
    }

    return aquariumType;
  }

  async getParameters(): Promise<ParameterDTO[]> {
    const { data: parameters, error } = await this.supabase
      .from("parameters")
      .select("id, name, full_name, unit, description")
      .order("name");

    if (error) {
      throw error;
    }

    return parameters || [];
  }

  async getParameter(id: string): Promise<ParameterDTO> {
    const { data: parameter, error } = await this.supabase
      .from("parameters")
      .select("id, name, full_name, unit, description")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("NOT_FOUND");
      }
      throw error;
    }

    if (!parameter) {
      throw new Error("NOT_FOUND");
    }

    return parameter;
  }

  async getDefaultOptimalValues(
    filters: {
      aquarium_type_id?: string;
      parameter_id?: string;
    } = {}
  ): Promise<DefaultOptimalValueDTO[]> {
    let query = this.supabase.from("default_optimal_values").select(`
        id,
        aquarium_type_id,
        parameter_id,
        min_value,
        max_value,
        aquarium_type:aquarium_types(id, name),
        parameter:parameters(id, name, unit)
      `);

    if (filters.aquarium_type_id) {
      query = query.eq("aquarium_type_id", filters.aquarium_type_id);
    }

    if (filters.parameter_id) {
      query = query.eq("parameter_id", filters.parameter_id);
    }

    const { data: optimalValues, error } = await query.order("aquarium_type.name", { ascending: true });

    if (error) {
      throw error;
    }

    return optimalValues || [];
  }

  async getOptimalValuesForAquariumType(aquariumTypeId: string): Promise<DefaultOptimalValueWithParameterDTO[]> {
    const { data: optimalValues, error } = await this.supabase
      .from("default_optimal_values")
      .select(
        `
        id,
        parameter_id,
        min_value,
        max_value,
        parameter:parameters(id, name, full_name, unit)
      `
      )
      .eq("aquarium_type_id", aquariumTypeId)
      .order("parameter.name");

    if (error) {
      throw error;
    }

    return optimalValues || [];
  }
}
