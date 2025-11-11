import type { ParameterStatusViewModel } from "@/types";
import { ParameterCard } from "./ParameterCard";

interface ParameterCardsGridProps {
  parameters: ParameterStatusViewModel[];
  onParameterClick: (parameterId: string) => void;
}

/**
 * Responsive grid container for parameter cards
 * Displays 1 column on mobile, 2 on tablet, 3 on desktop
 */
export function ParameterCardsGrid({ parameters, onParameterClick }: ParameterCardsGridProps) {
  if (parameters.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {parameters.map((parameter) => (
        <ParameterCard
          key={parameter.parameterId}
          parameter={parameter}
          onClick={() => onParameterClick(parameter.parameterId)}
        />
      ))}
    </div>
  );
}
