import { Button } from "@/components/ui/button";

interface AddMeasurementButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Primary action button for adding new measurements
 * Opens measurement form modal when clicked
 */
export function AddMeasurementButton({ onClick, disabled = false }: AddMeasurementButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled} size="default" className="gap-2">
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Add Measurement
    </Button>
  );
}
