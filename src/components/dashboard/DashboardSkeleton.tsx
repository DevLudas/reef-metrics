/**
 * Loading skeleton for dashboard header
 */
function DashboardHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* Selector skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
          <div className="h-10 w-[280px] animate-pulse rounded-md bg-gray-200"></div>
        </div>
        {/* Button skeleton */}
        <div className="h-10 w-40 animate-pulse rounded-md bg-gray-200"></div>
      </div>
      {/* Last measurement skeleton */}
      <div className="h-4 w-48 animate-pulse rounded bg-gray-200"></div>
    </div>
  );
}

/**
 * Loading skeleton for a single parameter card
 */
function ParameterCardSkeleton() {
  return (
    <div className="rounded-lg border-2 border-gray-200 p-4">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
          <div className="h-3 w-32 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200"></div>
      </div>

      {/* Current value */}
      <div className="mb-3 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200"></div>
      </div>

      {/* Optimal range */}
      <div className="mb-2 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200"></div>
      </div>

      {/* Status icon */}
      <div className="mb-3 mt-3">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
      </div>

      {/* Footer */}
      <div className="h-3 w-36 animate-pulse rounded bg-gray-200"></div>
    </div>
  );
}

/**
 * Loading skeleton for parameter cards grid
 */
function ParameterCardsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <ParameterCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Full dashboard loading skeleton
 * Displays placeholder content while data is loading
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <DashboardHeaderSkeleton />
      <ParameterCardsGridSkeleton />
    </div>
  );
}
