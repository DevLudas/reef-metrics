import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AquariumTypeDTO, CreateAquariumCommand } from "@/types";
import { aquariumFormSchema, type AquariumFormData } from "@/lib/validation/aquarium.validation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface AquariumFormProps {
  onSubmit: (data: CreateAquariumCommand) => Promise<void>;
  onSuccess?: () => void;
  initialData?: Partial<CreateAquariumCommand>;
  isSubmitting?: boolean;
}

export function AquariumForm({ onSubmit, initialData, isSubmitting = false }: AquariumFormProps) {
  const [aquariumTypes, setAquariumTypes] = useState<AquariumTypeDTO[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(aquariumFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      aquarium_type_id: initialData?.aquarium_type_id || "",
      volume: initialData?.volume || undefined,
      description: initialData?.description || "",
    },
  });

  const selectedTypeId = watch("aquarium_type_id");

  useEffect(() => {
    reset({
      name: initialData?.name || "",
      aquarium_type_id: initialData?.aquarium_type_id || "",
      volume: initialData?.volume || undefined,
      description: initialData?.description || "",
    });
  }, [initialData, reset]);

  useEffect(() => {
    const fetchAquariumTypes = async () => {
      try {
        const response = await fetch("/api/aquarium-types");
        if (!response.ok) {
          throw new Error("Failed to fetch aquarium types");
        }
        const result = await response.json();
        setAquariumTypes(result.data || []);
      } catch {
        // Error fetching aquarium types - will show empty list
      } finally {
        setIsLoadingTypes(false);
      }
    };

    fetchAquariumTypes();
  }, []);

  const handleFormSubmit = async (data: AquariumFormData) => {
    await onSubmit(data as CreateAquariumCommand);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5" data-testid="aquarium-form">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="My Reef Tank"
          disabled={isSubmitting}
          className="w-full"
          data-testid="aquarium-name-input"
        />
        {errors.name && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Aquarium Type Field */}
      <div className="space-y-2">
        <Label htmlFor="aquarium_type_id" className="text-sm font-medium">
          Aquarium Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedTypeId}
          onValueChange={(value) => setValue("aquarium_type_id", value)}
          disabled={isSubmitting || isLoadingTypes}
        >
          <SelectTrigger id="aquarium_type_id" className="w-full" data-testid="aquarium-type-select">
            <SelectValue placeholder={isLoadingTypes ? "Loading types..." : "Select an aquarium type"} />
          </SelectTrigger>
          <SelectContent data-testid="aquarium-type-select-content">
            {aquariumTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{type.name}</span>
                  {type.description && <span className="text-xs text-muted-foreground">{type.description}</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.aquarium_type_id && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.aquarium_type_id.message}
          </p>
        )}
      </div>

      {/* Volume Field */}
      <div className="space-y-2">
        <Label htmlFor="volume" className="text-sm font-medium">
          Volume (liters)
        </Label>
        <div className="relative">
          <Input
            id="volume"
            type="number"
            step="0.1"
            {...register("volume")}
            placeholder="100"
            disabled={isSubmitting}
            className="w-full pr-8"
            data-testid="aquarium-volume-input"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">L</span>
        </div>
        {errors.volume && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.volume.message}
          </p>
        )}
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Additional information about your aquarium..."
          disabled={isSubmitting}
          rows={3}
          className="w-full resize-y"
          data-testid="aquarium-description-input"
        />
        {errors.description && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto gap-2"
          data-testid="save-aquarium-button"
        >
          {isSubmitting && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          <span>{isSubmitting ? "Saving..." : "Save Aquarium"}</span>
        </Button>
      </div>
    </form>
  );
}
