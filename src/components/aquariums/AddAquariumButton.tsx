import { useState } from "react";
import { AquariumFormModal } from "./AquariumFormModal";
import { Button } from "@/components/ui/button";

export function AddAquariumButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    // Optional: reload the page to see the new aquarium
    // window.location.reload();
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden sm:inline">Add New Aquarium</span>
      </Button>
      <AquariumFormModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
