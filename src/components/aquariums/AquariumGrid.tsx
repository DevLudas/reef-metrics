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
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">Your Aquariums</h2>
          <p className="text-muted-foreground mt-1">
            Here is a list of all your aquariums. You can add a new one or manage existing ones.
          </p>
        </div>
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
