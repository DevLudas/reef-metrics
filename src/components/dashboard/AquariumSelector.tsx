import type { AquariumListItemDTO } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AquariumSelectorProps {
  aquariums: AquariumListItemDTO[];
  selectedId: string;
  onChange: (aquariumId: string) => void;
}

/**
 * Dropdown selector for switching between user's aquariums
 * Displays aquarium name and type, allows navigation to add new aquarium
 */
export function AquariumSelector({ aquariums, selectedId, onChange }: AquariumSelectorProps) {
  const selectedAquarium = aquariums.find((a) => a.id === selectedId);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="aquarium-selector" className="text-sm font-medium text-gray-700">
        Aquarium:
      </label>
      <Select value={selectedId} onValueChange={onChange}>
        <SelectTrigger id="aquarium-selector" className="w-[280px]" aria-label="Select an aquarium">
          <SelectValue>
            {selectedAquarium ? (
              <span className="flex items-center gap-2">
                <span className="font-medium">{selectedAquarium.name}</span>
                <span className="text-xs text-gray-500">({selectedAquarium.aquarium_type.name})</span>
              </span>
            ) : (
              "Select an aquarium"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {aquariums.map((aquarium) => (
            <SelectItem key={aquarium.id} value={aquarium.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{aquarium.name}</span>
                <span className="text-xs text-gray-500">({aquarium.aquarium_type.name})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
