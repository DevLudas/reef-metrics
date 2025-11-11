import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NoAquariumsEmptyStateProps {
  onAddAquarium: () => void;
}

/**
 * Empty state component shown when user has no aquariums
 * Encourages user to create their first aquarium
 */
export function NoAquariumsEmptyState({ onAddAquarium }: NoAquariumsEmptyStateProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {/* Icon */}
        <div className="mb-4 rounded-full bg-blue-100 p-4">
          <svg
            className="h-12 w-12 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="mb-2 text-2xl font-bold text-gray-900">No Aquariums Yet</h2>

        {/* Description */}
        <p className="mb-6 text-gray-600">
          Get started by creating your first aquarium to track water parameters and keep your reef healthy.
        </p>

        {/* CTA Button */}
        <Button onClick={onAddAquarium} size="lg" className="min-w-[200px]">
          Add Your First Aquarium
        </Button>
      </CardContent>
    </Card>
  );
}
