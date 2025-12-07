import { AquariumCard } from "./AquariumCard";
import { AddAquariumButton } from "./AddAquariumButton";
import type { AquariumListItemDTO } from "@/types";

interface AquariumGridProps {
  aquariums: AquariumListItemDTO[];
}

export function AquariumGrid({ aquariums }: AquariumGridProps) {
  const handleAquariumChange = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-end items-start gap-4">
        <AddAquariumButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aquariums.map((aquarium) => (
          <AquariumCard key={aquarium.id} aquarium={aquarium} onAquariumDeleted={handleAquariumChange} />
        ))}
      </div>
    </div>
  );
}
