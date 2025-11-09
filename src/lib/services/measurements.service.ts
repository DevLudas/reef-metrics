import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateMeasurementCommand,
  BulkCreateMeasurementsCommand,
  UpdateMeasurementCommand,
  MeasurementDTO,
  LatestMeasurementDTO,
  MeasurementDateDTO,
  MeasurementEntity,
} from "@/types";

export class MeasurementsService {
  constructor(private supabase: SupabaseClient) {}

  async getMeasurements(
    userId: string,
    aquariumId: string,
    filters: {
      start_date?: string;
      end_date?: string;
      parameter_id?: string;
    } = {},
    pagination: {
      limit?: number;
      offset?: number;
    } = {},
    sort: {
      sort?: "measurement_time" | "created_at";
      order?: "asc" | "desc";
    } = {}
  ): Promise<{ measurements: MeasurementDTO[]; total: number }> {
    // First check if aquarium exists and user owns it
    const { data: aquarium, error: aquariumError } = await this.supabase
      .from("aquariums")
      .select("id")
      .eq("id", aquariumId)
      .eq("user_id", userId)
      .single();

    if (aquariumError || !aquarium) {
      throw new Error("NOT_FOUND");
    }

    let query = this.supabase
      .from("measurements")
      .select(
        `
        id,
        aquarium_id,
        parameter_id,
        value,
        measurement_time,
        notes,
        created_at,
        parameter:parameters(id, name, full_name, unit)
        `,
        { count: "exact" }
      )
      .eq("aquarium_id", aquariumId);

    // Apply filters
    if (filters.start_date) {
      query = query.gte("measurement_time", filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte("measurement_time", filters.end_date);
    }
    if (filters.parameter_id) {
      query = query.eq("parameter_id", filters.parameter_id);
    }

    // Apply sorting
    const sortField = sort.sort || "measurement_time";
    const sortOrder = sort.order === "asc";
    query = query.order(sortField, { ascending: sortOrder });

    // Apply pagination
    const limit = Math.min(pagination.limit || 50, 200);
    const offset = pagination.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data: measurements, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      measurements: measurements || [],
      total: count || 0,
    };
  }

  async getLatestMeasurements(userId: string, aquariumId: string): Promise<LatestMeasurementDTO[]> {
    // First check if aquarium exists and user owns it
    const { data: aquarium, error: aquariumError } = await this.supabase
      .from("aquariums")
      .select("id")
      .eq("id", aquariumId)
      .eq("user_id", userId)
      .single();

    if (aquariumError || !aquarium) {
      throw new Error("NOT_FOUND");
    }

    // Get latest measurement per parameter
    const { data: measurements, error } = await this.supabase.rpc("get_latest_measurements", {
      p_aquarium_id: aquariumId,
    });

    if (error) {
      throw error;
    }

    return measurements || [];
  }

  async getMeasurementsByDate(userId: string, aquariumId: string, date: string): Promise<MeasurementDTO[]> {
    // First check if aquarium exists and user owns it
    const { data: aquarium, error: aquariumError } = await this.supabase
      .from("aquariums")
      .select("id")
      .eq("id", aquariumId)
      .eq("user_id", userId)
      .single();

    if (aquariumError || !aquarium) {
      throw new Error("NOT_FOUND");
    }

    const startDate = `${date}T00:00:00.000Z`;
    const endDate = `${date}T23:59:59.999Z`;

    const { data: measurements, error } = await this.supabase
      .from("measurements")
      .select(
        `
        id,
        aquarium_id,
        parameter_id,
        value,
        measurement_time,
        notes,
        created_at,
        parameter:parameters(id, name, full_name, unit)
        `
      )
      .eq("aquarium_id", aquariumId)
      .gte("measurement_time", startDate)
      .lte("measurement_time", endDate)
      .order("measurement_time", { ascending: true });

    if (error) {
      throw error;
    }

    return measurements || [];
  }

  async getMeasurementCalendar(userId: string, aquariumId: string): Promise<MeasurementDateDTO[]> {
    // First check if aquarium exists and user owns it
    const { data: aquarium, error: aquariumError } = await this.supabase
      .from("aquariums")
      .select("id")
      .eq("id", aquariumId)
      .eq("user_id", userId)
      .single();

    if (aquariumError || !aquarium) {
      throw new Error("NOT_FOUND");
    }

    const { data: calendar, error } = await this.supabase.rpc("get_measurement_calendar", {
      p_aquarium_id: aquariumId,
    });

    if (error) {
      throw error;
    }

    return calendar || [];
  }

  async getMeasurement(userId: string, measurementId: string): Promise<MeasurementDTO> {
    const { data: measurement, error } = await this.supabase
      .from("measurements")
      .select(
        `
        id,
        aquarium_id,
        parameter_id,
        value,
        measurement_time,
        notes,
        created_at,
        parameter:parameters(id, name, full_name, unit),
        aquarium:aquariums!inner(user_id)
        `
      )
      .eq("id", measurementId)
      .eq("aquarium.user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("NOT_FOUND");
      }
      throw error;
    }

    if (!measurement) {
      throw new Error("NOT_FOUND");
    }

    return measurement;
  }

  async createMeasurement(
    userId: string,
    aquariumId: string,
    command: CreateMeasurementCommand
  ): Promise<MeasurementEntity> {
    // First check if aquarium exists and user owns it
    const { data: aquarium, error: aquariumError } = await this.supabase
      .from("aquariums")
      .select("id")
      .eq("id", aquariumId)
      .eq("user_id", userId)
      .single();

    if (aquariumError || !aquarium) {
      throw new Error("NOT_FOUND");
    }

    // Validate parameter exists
    const { data: parameter, error: paramError } = await this.supabase
      .from("parameters")
      .select("id")
      .eq("id", command.parameter_id)
      .single();

    if (paramError || !parameter) {
      throw new Error("PARAMETER_NOT_FOUND");
    }

    // Insert measurement
    const { data: measurement, error: insertError } = await this.supabase
      .from("measurements")
      .insert({
        aquarium_id: aquariumId,
        parameter_id: command.parameter_id,
        value: command.value,
        measurement_time: command.measurement_time || new Date().toISOString(),
        notes: command.notes,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return measurement;
  }

  async bulkCreateMeasurements(
    userId: string,
    aquariumId: string,
    command: BulkCreateMeasurementsCommand
  ): Promise<MeasurementEntity[]> {
    // First check if aquarium exists and user owns it
    const { data: aquarium, error: aquariumError } = await this.supabase
      .from("aquariums")
      .select("id")
      .eq("id", aquariumId)
      .eq("user_id", userId)
      .single();

    if (aquariumError || !aquarium) {
      throw new Error("NOT_FOUND");
    }

    // Validate all parameters exist
    const parameterIds = [...new Set(command.measurements.map((m) => m.parameter_id))];
    const { data: parameters, error: paramError } = await this.supabase
      .from("parameters")
      .select("id")
      .in("id", parameterIds);

    if (paramError) {
      throw paramError;
    }

    if (parameters?.length !== parameterIds.length) {
      throw new Error("PARAMETER_NOT_FOUND");
    }

    const measurementTime = command.measurement_time || new Date().toISOString();

    // Insert measurements
    const inserts = command.measurements.map((m) => ({
      aquarium_id: aquariumId,
      parameter_id: m.parameter_id,
      value: m.value,
      measurement_time: measurementTime,
      notes: m.notes,
    }));

    const { data: measurements, error: insertError } = await this.supabase
      .from("measurements")
      .insert(inserts)
      .select();

    if (insertError) {
      throw insertError;
    }

    return measurements || [];
  }

  async updateMeasurement(
    userId: string,
    measurementId: string,
    command: UpdateMeasurementCommand
  ): Promise<MeasurementEntity> {
    // First check ownership via join
    const { data: existing, error: checkError } = await this.supabase
      .from("measurements")
      .select("id, aquarium:aquariums!inner(user_id)")
      .eq("id", measurementId)
      .eq("aquarium.user_id", userId)
      .single();

    if (checkError || !existing) {
      throw new Error("NOT_FOUND");
    }

    // Update measurement
    const { data: measurement, error: updateError } = await this.supabase
      .from("measurements")
      .update({
        value: command.value,
        measurement_time: command.measurement_time,
        notes: command.notes,
      })
      .eq("id", measurementId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return measurement;
  }

  async deleteMeasurement(userId: string, measurementId: string): Promise<void> {
    // First check ownership via join
    const { data: existing, error: checkError } = await this.supabase
      .from("measurements")
      .select("id, aquarium:aquariums!inner(user_id)")
      .eq("id", measurementId)
      .eq("aquarium.user_id", userId)
      .single();

    if (checkError || !existing) {
      throw new Error("NOT_FOUND");
    }

    // Delete measurement
    const { error: deleteError } = await this.supabase.from("measurements").delete().eq("id", measurementId);

    if (deleteError) {
      throw deleteError;
    }
  }
}
