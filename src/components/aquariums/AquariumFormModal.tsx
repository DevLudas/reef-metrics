import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AquariumForm } from "./AquariumForm";
import type { AquariumDTO, CreateAquariumCommand } from "@/types";
import { useToast } from "@/components/hooks/useToast";

interface AquariumFormModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  aquariumToEdit?: AquariumDTO;
  onSuccess: () => void;
}

export function AquariumFormModal({ isOpen, setIsOpen, aquariumToEdit, onSuccess }: AquariumFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (data: CreateAquariumCommand) => {
    setIsSubmitting(true);
    try {
      const isEditing = !!aquariumToEdit;
      const url = isEditing ? `/api/aquariums/${aquariumToEdit.id}` : "/api/aquariums";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to save aquarium");
      }

      success(
        isEditing ? "Aquarium updated" : "Aquarium created",
        `${data.name} has been ${isEditing ? "updated" : "created"} successfully.`
      );

      onSuccess?.();
    } catch (err) {
      error("Error", err instanceof Error ? err.message : "Failed to save aquarium");
    } finally {
      setIsSubmitting(false);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-2xl"
        data-testid="aquarium-form-modal"
        onInteractOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{aquariumToEdit ? "Edit Aquarium" : "Add New Aquarium"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {aquariumToEdit
              ? "Update the details of your aquarium."
              : "Create a new aquarium to start tracking water parameters."}
          </DialogDescription>
        </DialogHeader>
        <AquariumForm
          onSubmit={handleSubmit}
          initialData={
            aquariumToEdit
              ? {
                  name: aquariumToEdit.name,
                  aquarium_type_id: aquariumToEdit.aquarium_type_id,
                  volume: aquariumToEdit.volume || undefined,
                  description: aquariumToEdit.description || undefined,
                }
              : undefined
          }
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
