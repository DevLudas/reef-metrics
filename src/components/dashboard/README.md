# Dashboard Components

This directory contains all components related to the main dashboard view of Reef Metrics.

## Architecture

The dashboard follows a **server-side rendering (SSR)** pattern with minimal client-side interactivity:

- **Data fetching**: All data is fetched server-side in Astro pages using the `DashboardService`
- **Rendering**: Data is passed as props to React components
- **Interactivity**: Only UI interactions (drawer, navigation) use React state
- **Navigation**: Aquarium selection uses URL parameters for state persistence

### Data Flow

```
index.astro
  ↓ (server-side)
  DashboardService.getDashboardData()
  ↓ (fetches from Supabase)
  - Aquariums
  - Latest Measurements
  - Optimal Values
  ↓ (calculates)
  - Parameter Statuses
  ↓ (passes as props)
  DashboardContent (React)
  ↓ (renders)
  Dashboard UI
```

### Benefits of This Architecture

1. **Performance**: Data is fetched on the server, reducing client-side JavaScript
2. **SEO**: Content is rendered server-side and available to search engines
3. **Simplicity**: No complex client-side state management
4. **Reliability**: Each page load gets fresh data from the database
5. **URL-based state**: Aquarium selection persists in URL, allowing bookmarking and sharing

## Components

### DashboardContent

Main container component that receives data as props and orchestrates the dashboard layout.

**Props:**
- `aquariums`: List of user's aquariums
- `selectedAquariumId`: Currently selected aquarium ID
- `parameters`: Calculated parameter statuses with measurements
- `lastMeasurementTime`: Most recent measurement timestamp

**State:**
- `selectedParameterId`: For drawer interaction
- `isDrawerOpen`: Drawer visibility state

### DashboardHeader

Displays aquarium selector and action buttons.

**Props:**
- `aquariums`: List of aquariums for the selector
- `selectedAquariumId`: Currently selected aquarium
- `lastMeasurementTime`: For displaying last update time
- `onAquariumChange`: Callback when aquarium is changed
- `onAddMeasurement`: Callback for add measurement button

### ParameterCardsGrid

Grid layout for displaying parameter cards.

**Props:**
- `parameters`: Array of parameter status view models
- `onParameterClick`: Callback when a card is clicked

### ParameterCard

Individual parameter card showing current value, status, and deviation.

**Props:**
- `parameter`: Parameter status view model
- `onClick`: Callback when card is clicked

### AIRecommendationDrawer

Side drawer for displaying AI-powered recommendations for a parameter.

**Props:**
- `isOpen`: Drawer visibility
- `parameter`: Selected parameter details
- `aquariumId`: Current aquarium ID
- `onClose`: Callback to close drawer

### Empty States

- `NoAquariumsEmptyState`: Shown when user has no aquariums
- `NoMeasurementsEmptyState`: Shown when selected aquarium has no measurements
- `DashboardSkeleton`: Loading state (for future use with streaming)

## Services

### DashboardService

Server-side service for aggregating dashboard data.

**Location:** `/src/lib/services/dashboard.service.ts`

**Methods:**
- `getDashboardData(userId, preferredAquariumId)`: Fetches and aggregates all dashboard data

**Features:**
- Fetches aquariums, measurements, and optimal values in parallel
- Calculates parameter statuses with color coding
- Sorts parameters by priority (critical → warning → normal → no data)
- Handles empty states gracefully

## Usage

### In Astro Pages

```astro
---
import { DashboardService } from "@/lib/services/dashboard.service";
import { DashboardContent } from "@/components/dashboard";

const userId = "..."; // From session
const preferredAquariumId = Astro.url.searchParams.get("aquarium");

const dashboardService = new DashboardService(Astro.locals.supabase);
const dashboardData = await dashboardService.getDashboardData(userId, preferredAquariumId);
---

<DashboardContent
  client:load
  aquariums={dashboardData.aquariums}
  selectedAquariumId={dashboardData.selectedAquariumId}
  parameters={dashboardData.parameters}
  lastMeasurementTime={dashboardData.lastMeasurementTime}
/>
```

### Aquarium Selection

Aquarium selection is handled via URL parameters:

```typescript
const handleAquariumChange = (id: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set("aquarium", id);
  window.location.href = url.toString();
};
```

This triggers a page reload with fresh data from the database.

## Migration from Hooks

The dashboard was refactored from a client-side hook-based architecture to server-side rendering:

### Before (Client-Side)
- Used `useDashboard` hook with useState/useEffect
- Fetched data via API endpoints on mount
- Client-side state management
- Multiple re-renders and loading states

### After (Server-Side)
- Data fetched in Astro page during SSR
- Props passed to React component
- Minimal client-side state (only UI interactions)
- Single render with complete data

### Removed Files
- `hooks/useDashboard.ts` - No longer needed

## Future Enhancements

- Add measurement form modal
- Implement optimistic UI updates for measurements
- Add real-time updates using Supabase subscriptions
- Add historical charts for parameter trends
- Implement parameter alerts and notifications

