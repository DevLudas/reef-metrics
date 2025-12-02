import { useState } from "react";
import type { AquariumListItemDTO, AquariumDTO } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AquariumFormModal } from "./AquariumFormModal";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { useToast } from "@/components/hooks/useToast";

interface AquariumCardProps {
  aquarium: AquariumListItemDTO;
  onAquariumDeleted: (id: string) => void;
}

export function AquariumCard({ aquarium, onAquariumDeleted }: AquariumCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/aquariums/${aquarium.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete aquarium");
      }

      toast({
        title: "Aquarium deleted",
        description: `${aquarium.name} has been deleted successfully.`,
      });

      onAquariumDeleted(aquarium.id);
    } catch (error) {
      console.error("Error deleting aquarium:", error);
      toast({
        title: "Error",
        description: "Failed to delete aquarium. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Convert AquariumListItemDTO to AquariumDTO for the edit modal
  const aquariumForEdit: AquariumDTO = {
    id: aquarium.id,
    user_id: aquarium.user_id,
    aquarium_type_id: aquarium.aquarium_type_id,
    name: aquarium.name,
    description: aquarium.description,
    volume: aquarium.volume,
    created_at: aquarium.created_at,
    updated_at: aquarium.updated_at,
    aquarium_type: {
      id: aquarium.aquarium_type.id,
      name: aquarium.aquarium_type.name,
    },
  };

  return (
    <>
      <div className="group relative rounded-lg border bg-card transition-all hover:shadow-lg hover:border-primary/50">
        <div className="p-6">
          {/* Header with dropdown */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate mb-1 group-hover:text-primary transition-colors">
                {aquarium.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <span className="truncate">{aquarium.aquarium_type.name}</span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" aria-label="Aquarium options">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {aquarium.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{aquarium.description}</p>
          )}

          {/* Volume */}
          {aquarium.volume && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <svg
                className="h-4 w-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span>Volume: {aquarium.volume}L</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t pt-4 mt-auto">
            <a
              href={`/?aquarium=${aquarium.id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              <span>View Dashboard</span>
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <AquariumFormModal
        isOpen={isEditModalOpen}
        setIsOpen={setIsEditModalOpen}
        aquariumToEdit={aquariumForEdit}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        aquariumName={aquarium.name}
        isDeleting={isDeleting}
      />
    </>
  );
}
