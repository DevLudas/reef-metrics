import { z } from "zod";

export const aquariumFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name is too long"),
  aquarium_type_id: z.string().uuid("Please select an aquarium type"),
  volume: z.coerce.number().positive("Volume must be a positive number").optional(),
  description: z.string().max(255, "Description is too long").optional(),
});

export type AquariumFormData = z.infer<typeof aquariumFormSchema>;
