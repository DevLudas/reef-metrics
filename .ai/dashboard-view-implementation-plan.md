# View Implementation Plan: Dashboard View

## 1. Overview

The Dashboard View is the main landing page of the ReefMetrics application, accessible at the root path `/`. It provides users with an at-a-glance overview of their aquarium's current water parameters by displaying the latest measurements for each parameter with visual status indicators (green/orange/red) based on deviation from optimal ranges. The view supports multiple aquariums through a dropdown selector, displays parameter cards in a responsive grid, and provides an AI recommendation drawer for detailed parameter analysis. Empty states are shown when no aquariums or measurements exist, guiding users to take appropriate actions.

## 2. View Routing

- **Path**: `/`
- **Type**: Server-side rendered Astro page with React components for interactivity
- **Authentication**: Required (user must be logged in)

## 3. Component Structure

```
DashboardPage (index.astro)
├── Layout
│   └── DashboardContent (React)
│       ├── DashboardHeader (React)
│       │   ├── AquariumSelector (React)
│       │   └── AddMeasurementButton (React)
│       ├── EmptyState (React) [conditional]
│       │   ├── NoAquariumsEmptyState (React)
│       │   └── NoMeasurementsEmptyState (React)
│       ├── ParameterCardsGrid (React) [conditional]
│       │   └── ParameterCard (React) [multiple instances]
│       └── AIRecommendationDrawer (React)
```

## 4. Component Details

### 4.1 DashboardPage (index.astro)

- **Component description**: The main Astro page component that serves as the root of the dashboard view. It handles initial server-side rendering, authentication checks via middleware, and wraps the interactive React components within the application layout.

- **Main elements**:
  - `<Layout>` wrapper for consistent page structure
  - `<DashboardContent>` React component (client-side interactive)

- **Handled events**: None (server-rendered)

- **Validation conditions**: 
  - User must be authenticated (handled by middleware)

- **Types**:
  - None specific (relies on middleware for user context)

- **Props**: None

### 4.2 DashboardContent (React)

- **Component description**: The main client-side component that orchestrates the entire dashboard functionality. It manages state for the selected aquarium, latest measurements, optimal values, loading states, and the AI recommendation drawer. It fetches data from the API and renders appropriate content based on the current state.

- **Main elements**:
  - `<DashboardHeader>` - Top section with aquarium selector and action buttons
  - `<EmptyState>` - Conditional rendering when no data exists
  - `<ParameterCardsGrid>` - Grid of parameter cards when measurements exist
  - `<AIRecommendationDrawer>` - Slide-out panel for AI recommendations
  - Loading skeletons during data fetching

- **Handled events**:
  - Initial data load (useEffect on mount)
  - Aquarium selection change
  - Parameter card click (opens AI drawer)
  - Drawer close
  - Add measurement action completion (refreshes data)

- **Validation conditions**:
  - Validate that aquarium list is not empty before rendering selector
  - Validate that measurements exist before rendering parameter cards
  - Verify optimal values are available for status calculation

- **Types**:
  - `DashboardViewModel` (custom view model)
  - `AquariumListItemDTO[]` (from API)
  - `LatestMeasurementDTO[]` (from API)
  - `DefaultOptimalValueWithParameterDTO[]` (from API)
  - `ParameterStatusViewModel[]` (calculated)

- **Props**:
  ```typescript
  interface DashboardContentProps {
    initialUserId: string; // Passed from Astro context
  }
  ```

### 4.3 DashboardHeader (React)

- **Component description**: The header section of the dashboard containing the aquarium selector dropdown and the "Add Measurement" button. It displays the currently selected aquarium's name and type, and provides quick access to add new measurements.

- **Main elements**:
  - `<div>` container with flex layout
  - `<AquariumSelector>` dropdown component
  - `<AddMeasurementButton>` primary action button
  - Optional: Last measurement timestamp display

- **Handled events**:
  - None directly (delegates to child components)

- **Validation conditions**:
  - Aquarium list must not be empty to render selector
  - Selected aquarium must be valid

- **Types**:
  - `AquariumListItemDTO[]`
  - `string` for selected aquarium ID
  - `string | null` for last measurement time

- **Props**:
  ```typescript
  interface DashboardHeaderProps {
    aquariums: AquariumListItemDTO[];
    selectedAquariumId: string | null;
    lastMeasurementTime: string | null;
    onAquariumChange: (aquariumId: string) => void;
    onAddMeasurement: () => void;
  }
  ```

### 4.4 AquariumSelector (React)

- **Component description**: A dropdown component that allows users to switch between their aquariums. It displays the current aquarium's name and type, and provides a list of all available aquariums. Includes an option to add a new aquarium.

- **Main elements**:
  - Select/Dropdown trigger button showing current aquarium
  - Dropdown menu with list of aquariums
  - "Add New Aquarium" action item at the bottom
  - Aquarium type badge/label for each item

- **Handled events**:
  - `onChange`: Fired when user selects a different aquarium
  - `onAddNew`: Fired when user clicks "Add New Aquarium"

- **Validation conditions**:
  - At least one aquarium must exist to render selector
  - Selected aquarium ID must match one in the list

- **Types**:
  - `AquariumListItemDTO[]`
  - `string` for selected ID

- **Props**:
  ```typescript
  interface AquariumSelectorProps {
    aquariums: AquariumListItemDTO[];
    selectedId: string;
    onChange: (aquariumId: string) => void;
  }
  ```

### 4.5 AddMeasurementButton (React)

- **Component description**: A primary action button that opens a modal/form for adding new measurements. The button is prominently displayed and uses Shadcn/ui Button component with primary variant.

- **Main elements**:
  - `<Button>` from Shadcn/ui
  - Icon (plus sign)
  - Text label "Add Measurement"

- **Handled events**:
  - `onClick`: Opens the measurement form modal

- **Validation conditions**:
  - Button should be disabled if no aquarium is selected

- **Types**: None specific

- **Props**:
  ```typescript
  interface AddMeasurementButtonProps {
    onClick: () => void;
    disabled?: boolean;
  }
  ```

### 4.6 EmptyState (React)

- **Component description**: A container component that conditionally renders one of two empty state messages: either when the user has no aquariums, or when the selected aquarium has no measurements.

- **Main elements**:
  - `<NoAquariumsEmptyState>` or `<NoMeasurementsEmptyState>` (conditional)

- **Handled events**: None directly

- **Validation conditions**:
  - Determines which empty state to show based on aquarium count and measurement count

- **Types**:
  - `EmptyStateType: 'no-aquariums' | 'no-measurements'`

- **Props**:
  ```typescript
  interface EmptyStateProps {
    type: 'no-aquariums' | 'no-measurements';
    onAddAquarium?: () => void;
    onAddMeasurement?: () => void;
  }
  ```

### 4.7 NoAquariumsEmptyState (React)

- **Component description**: Displays a message encouraging the user to create their first aquarium, with a call-to-action button to navigate to the aquarium creation form.

- **Main elements**:
  - Icon/illustration
  - Heading: "No Aquariums Yet"
  - Description text
  - `<Button>` "Add Your First Aquarium"

- **Handled events**:
  - `onClick`: Navigate to add aquarium page

- **Validation conditions**: None

- **Types**: None specific

- **Props**:
  ```typescript
  interface NoAquariumsEmptyStateProps {
    onAddAquarium: () => void;
  }
  ```

### 4.8 NoMeasurementsEmptyState (React)

- **Component description**: Displays a message encouraging the user to add their first measurement for the selected aquarium, with a call-to-action button to open the measurement form.

- **Main elements**:
  - Icon/illustration
  - Heading: "No Measurements Yet"
  - Description text
  - Aquarium name display
  - `<Button>` "Add Your First Measurement"

- **Handled events**:
  - `onClick`: Open measurement form

- **Validation conditions**: None

- **Types**: None specific

- **Props**:
  ```typescript
  interface NoMeasurementsEmptyStateProps {
    aquariumName: string;
    onAddMeasurement: () => void;
  }
  ```

### 4.9 ParameterCardsGrid (React)

- **Component description**: A responsive grid container that displays all parameter cards. Uses CSS Grid with responsive columns (1 column on mobile, 2-3 on tablet, 3-4 on desktop).

- **Main elements**:
  - Grid container (`<div>`)
  - Multiple `<ParameterCard>` instances

- **Handled events**: None directly

- **Validation conditions**:
  - Parameters array must not be empty

- **Types**:
  - `ParameterStatusViewModel[]`

- **Props**:
  ```typescript
  interface ParameterCardsGridProps {
    parameters: ParameterStatusViewModel[];
    onParameterClick: (parameterId: string) => void;
  }
  ```

### 4.10 ParameterCard (React)

- **Component description**: Displays a single parameter's current value, optimal range, and status indicator. Uses Shadcn/ui Card component. The card is clickable and shows visual feedback on hover. Status is indicated by colored border and icon (green/orange/red based on deviation percentage).

- **Main elements**:
  - `<Card>` wrapper from Shadcn/ui
  - `<CardHeader>` with parameter name and status icon
  - `<CardContent>` with:
    - Current value with unit
    - Optimal range display
    - Deviation percentage (if applicable)
    - Status indicator (colored dot or badge)
  - `<CardFooter>` with measurement timestamp

- **Handled events**:
  - `onClick`: Opens AI recommendation drawer for this parameter

- **Validation conditions**:
  - Validate that current value exists
  - Calculate deviation percentage correctly
  - Ensure status matches deviation thresholds:
    - Green (normal): deviation < 10%
    - Orange (warning): deviation 10-20%
    - Red (critical): deviation > 20%
    - Gray (no_data): no measurement available

- **Types**:
  - `ParameterStatusViewModel`

- **Props**:
  ```typescript
  interface ParameterCardProps {
    parameter: ParameterStatusViewModel;
    onClick: () => void;
  }
  ```

### 4.11 AIRecommendationDrawer (React)

- **Component description**: A slide-out drawer/panel that displays AI-generated analysis and recommendations for a selected parameter. It appears from the right side of the screen, includes focus trapping, and can be dismissed with ESC key or close button. Shows loading state while fetching recommendations.

- **Main elements**:
  - Drawer container (overlay + panel)
  - Close button (X icon)
  - Parameter header with name and current value
  - Optimal range display
  - Status indicator
  - AI analysis text section
  - Recommendations list (bullet points)
  - Disclaimer text at bottom
  - Loading skeleton during fetch

- **Handled events**:
  - `onClose`: Close drawer
  - `onEscapeKey`: Close drawer on ESC key press
  - Focus trap: Keep focus within drawer when open

- **Validation conditions**:
  - Drawer should only render when open and parameter is selected
  - Validate recommendation data structure
  - Ensure disclaimer is always visible

- **Types**:
  - `RecommendationDTO` (from API)
  - `ParameterStatusViewModel`
  - `boolean` for open state

- **Props**:
  ```typescript
  interface AIRecommendationDrawerProps {
    isOpen: boolean;
    parameter: ParameterStatusViewModel | null;
    onClose: () => void;
  }
  ```

## 5. Types

### 5.1 Existing API Types (from types.ts)

All API interaction types are already defined in `src/types.ts`:

- **`AquariumListItemDTO`**: Aquarium data for list views
  ```typescript
  {
    id: string;
    user_id: string;
    aquarium_type_id: string;
    name: string;
    description: string | null;
    volume: number | null;
    created_at: string;
    updated_at: string;
    aquarium_type: {
      id: string;
      name: string;
    };
  }
  ```

- **`LatestMeasurementDTO`**: Latest measurement data for each parameter
  ```typescript
  {
    id: string;
    aquarium_id: string;
    parameter_id: string;
    value: number;
    measurement_time: string;
    notes: string | null;
    created_at: string;
    parameter: {
      id: string;
      name: string;
      full_name: string;
      unit: string;
    };
  }
  ```

- **`DefaultOptimalValueWithParameterDTO`**: Optimal ranges for parameters
  ```typescript
  {
    id: string;
    parameter_id: string;
    min_value: number;
    max_value: number;
    parameter: {
      name: string;
      full_name: string;
      unit: string;
    };
  }
  ```

- **`RecommendationDTO`**: AI recommendation response
  ```typescript
  {
    parameter: {
      id: string;
      name: string;
      full_name: string;
      unit: string;
    };
    current_value: number;
    optimal_range: {
      min: number;
      max: number;
    };
    deviation_percentage: number;
    status: 'normal' | 'warning' | 'critical';
    analysis: string;
    recommendations: string[];
    disclaimer: string;
  }
  ```

- **`ParameterStatus`**: Status enum
  ```typescript
  type ParameterStatus = 'normal' | 'warning' | 'critical' | 'no_data';
  ```

### 5.2 New ViewModel Types

Create new types in a dedicated section of `src/types.ts` or in a new file `src/components/dashboard/types.ts`:

- **`ParameterStatusViewModel`**: Combined view model for parameter card display
  ```typescript
  interface ParameterStatusViewModel {
    parameterId: string;
    name: string;
    fullName: string;
    unit: string;
    currentValue: number | null;
    optimalMin: number;
    optimalMax: number;
    deviationPercentage: number | null;
    status: ParameterStatus;
    measurementTime: string | null;
  }
  ```

- **`DashboardViewModel`**: Main view model for dashboard state
  ```typescript
  interface DashboardViewModel {
    aquariums: AquariumListItemDTO[];
    selectedAquariumId: string | null;
    parameters: ParameterStatusViewModel[];
    lastMeasurementTime: string | null;
    isLoading: boolean;
    error: string | null;
  }
  ```

- **`DashboardEmptyStateType`**: Type for empty state variants
  ```typescript
  type DashboardEmptyStateType = 'no-aquariums' | 'no-measurements' | 'loading' | null;
  ```

## 6. State Management

### 6.1 Custom Hook: `useDashboard`

Create a custom hook `src/components/dashboard/hooks/useDashboard.ts` to encapsulate all dashboard logic:

**Purpose**: Centralize data fetching, state management, and business logic for the dashboard view.

**State Variables**:
- `aquariums`: `AquariumListItemDTO[]` - List of user's aquariums
- `selectedAquariumId`: `string | null` - Currently selected aquarium
- `measurements`: `LatestMeasurementDTO[]` - Latest measurements for selected aquarium
- `optimalValues`: `DefaultOptimalValueWithParameterDTO[]` - Optimal ranges for aquarium type
- `parameters`: `ParameterStatusViewModel[]` - Calculated parameter statuses
- `isLoading`: `boolean` - Loading state
- `error`: `string | null` - Error message
- `selectedParameterId`: `string | null` - For drawer
- `isDrawerOpen`: `boolean` - Drawer state

**Effects**:
1. **Load aquariums on mount**: Fetch user's aquariums via `GET /api/aquariums`
2. **Set initial selected aquarium**: Select first aquarium or restore from localStorage
3. **Load measurements when aquarium changes**: Fetch via `GET /api/aquariums/:id/measurements/latest`
4. **Load optimal values when aquarium changes**: Fetch via `GET /api/aquarium-types/:typeId/optimal-values`
5. **Calculate parameter statuses**: Combine measurements and optimal values into `ParameterStatusViewModel[]`

**Functions**:
- `handleAquariumChange(aquariumId: string)`: Update selected aquarium and persist to localStorage
- `handleParameterClick(parameterId: string)`: Open drawer with selected parameter
- `handleDrawerClose()`: Close drawer
- `refreshMeasurements()`: Refetch latest measurements
- `calculateStatus(value: number, min: number, max: number)`: Calculate parameter status

**Return Value**:
```typescript
{
  aquariums: AquariumListItemDTO[];
  selectedAquariumId: string | null;
  parameters: ParameterStatusViewModel[];
  lastMeasurementTime: string | null;
  isLoading: boolean;
  error: string | null;
  selectedParameter: ParameterStatusViewModel | null;
  isDrawerOpen: boolean;
  handleAquariumChange: (id: string) => void;
  handleParameterClick: (id: string) => void;
  handleDrawerClose: () => void;
  refreshMeasurements: () => Promise<void>;
}
```

### 6.2 Local Storage

Store selected aquarium ID in localStorage with key: `reefmetrics:selected-aquarium-id`

## 7. API Integration

### 7.1 Endpoints Used

1. **List User's Aquariums**
   - **Endpoint**: `GET /api/aquariums`
   - **Query**: `sort=created_at&order=desc`
   - **Response Type**: `AquariumsListResponseDTO` (which is `ApiListResponseDTO<AquariumListItemDTO>`)
   - **Used for**: Populating aquarium selector

2. **Get Latest Measurements**
   - **Endpoint**: `GET /api/aquariums/:aquariumId/measurements/latest`
   - **Response Type**: `LatestMeasurementsResponseDTO` (which is `ApiListResponseDTO<LatestMeasurementDTO>`)
   - **Used for**: Displaying current parameter values

3. **Get Optimal Values for Aquarium Type**
   - **Endpoint**: `GET /api/aquarium-types/:aquariumTypeId/optimal-values`
   - **Response Type**: `DefaultOptimalValuesForTypeResponseDTO` (which is `ApiListResponseDTO<DefaultOptimalValueWithParameterDTO>`)
   - **Used for**: Calculating parameter status and optimal ranges

4. **Get AI Recommendations** (Note: This endpoint is mentioned in types but not in the API plan - may need to be implemented)
   - **Endpoint**: `POST /api/aquariums/:aquariumId/recommendations`
   - **Request Type**: `GetRecommendationsCommand`
   - **Response Type**: `RecommendationResponseDTO` (which is `ApiResponseDTO<RecommendationDTO>`)
   - **Used for**: AI drawer content

### 7.2 API Client Implementation

Create `src/lib/api/dashboard.api.ts`:

```typescript
import type {
  AquariumsListResponseDTO,
  LatestMeasurementsResponseDTO,
  DefaultOptimalValuesForTypeResponseDTO,
  RecommendationResponseDTO,
  GetRecommendationsCommand,
} from '@/types';

export class DashboardAPI {
  async getAquariums(): Promise<AquariumsListResponseDTO> {
    const response = await fetch('/api/aquariums?sort=created_at&order=desc');
    if (!response.ok) throw new Error('Failed to fetch aquariums');
    return response.json();
  }

  async getLatestMeasurements(aquariumId: string): Promise<LatestMeasurementsResponseDTO> {
    const response = await fetch(`/api/aquariums/${aquariumId}/measurements/latest`);
    if (!response.ok) throw new Error('Failed to fetch measurements');
    return response.json();
  }

  async getOptimalValues(aquariumTypeId: string): Promise<DefaultOptimalValuesForTypeResponseDTO> {
    const response = await fetch(`/api/aquarium-types/${aquariumTypeId}/optimal-values`);
    if (!response.ok) throw new Error('Failed to fetch optimal values');
    return response.json();
  }

  async getRecommendations(
    aquariumId: string,
    command: GetRecommendationsCommand
  ): Promise<RecommendationResponseDTO> {
    const response = await fetch(`/api/aquariums/${aquariumId}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    if (!response.ok) throw new Error('Failed to fetch recommendations');
    return response.json();
  }
}
```

### 7.3 Error Handling

All API calls should handle:
- **401 Unauthorized**: Redirect to login
- **403 Forbidden**: Show error message
- **404 Not Found**: Show appropriate empty state
- **400 Bad Request**: Show validation error
- **500 Server Error**: Show generic error message

## 8. User Interactions

### 8.1 Aquarium Selection
- **Trigger**: User clicks on aquarium selector dropdown
- **Action**: Display list of aquariums with names and types
- **Result**: 
  - Selected aquarium ID is updated
  - Dashboard reloads with new aquarium's data
  - Selection is persisted to localStorage
  - Loading skeleton shown during data fetch

### 8.2 Parameter Card Click
- **Trigger**: User clicks on any parameter card
- **Action**: 
  - Open AI recommendation drawer from right
  - Show loading state in drawer
  - Fetch AI recommendations for the parameter
- **Result**: 
  - Drawer slides in with animation
  - Display parameter analysis and recommendations
  - Focus is trapped within drawer
  - Background content is dimmed with overlay

### 8.3 Close Drawer
- **Trigger**: User clicks close button, ESC key, or overlay
- **Action**: Close drawer with animation
- **Result**: 
  - Drawer slides out
  - Focus returns to the parameter card that opened it
  - Overlay fades out

### 8.4 Add Measurement
- **Trigger**: User clicks "Add Measurement" button
- **Action**: Open bulk measurement form modal
- **Result**: 
  - Modal appears with form for all parameters
  - User can enter values
  - On save, dashboard refreshes with new data

### 8.5 Add First Aquarium
- **Trigger**: User clicks "Add Your First Aquarium" in empty state
- **Action**: Navigate to aquarium creation page
- **Result**: User is redirected to `/aquariums/new` or similar

### 8.6 Add First Measurement
- **Trigger**: User clicks "Add Your First Measurement" in empty state
- **Action**: Open bulk measurement form
- **Result**: Form modal appears for data entry

## 9. Conditions and Validation

### 9.1 Display Conditions

1. **Show Aquarium Selector**
   - **Condition**: `aquariums.length > 0`
   - **Component**: `AquariumSelector`
   - **Effect**: Selector only renders if user has aquariums

2. **Show No Aquariums Empty State**
   - **Condition**: `aquariums.length === 0`
   - **Component**: `NoAquariumsEmptyState`
   - **Effect**: Displays prompt to add first aquarium

3. **Show No Measurements Empty State**
   - **Condition**: `aquariums.length > 0 && measurements.length === 0`
   - **Component**: `NoMeasurementsEmptyState`
   - **Effect**: Displays prompt to add first measurement

4. **Show Parameter Cards**
   - **Condition**: `parameters.length > 0`
   - **Component**: `ParameterCardsGrid`
   - **Effect**: Grid of cards only renders when data exists

5. **Show Loading Skeleton**
   - **Condition**: `isLoading === true`
   - **Component**: Skeleton cards
   - **Effect**: Displays loading placeholders during data fetch

6. **Disable Add Measurement Button**
   - **Condition**: `selectedAquariumId === null`
   - **Component**: `AddMeasurementButton`
   - **Effect**: Button is disabled if no aquarium selected

### 9.2 Status Calculation Validation

For each parameter, calculate status based on deviation:

```typescript
function calculateStatus(
  currentValue: number | null,
  optimalMin: number,
  optimalMax: number
): { status: ParameterStatus; deviationPercentage: number | null } {
  if (currentValue === null) {
    return { status: 'no_data', deviationPercentage: null };
  }

  // Calculate midpoint of optimal range
  const optimalMid = (optimalMin + optimalMax) / 2;
  
  // Calculate deviation percentage
  let deviation: number;
  
  if (currentValue < optimalMin) {
    deviation = ((optimalMin - currentValue) / optimalMin) * 100;
  } else if (currentValue > optimalMax) {
    deviation = ((currentValue - optimalMax) / optimalMax) * 100;
  } else {
    // Value is within range
    deviation = 0;
  }

  // Determine status based on deviation thresholds
  if (deviation < 10) {
    return { status: 'normal', deviationPercentage: deviation };
  } else if (deviation < 20) {
    return { status: 'warning', deviationPercentage: deviation };
  } else {
    return { status: 'critical', deviationPercentage: deviation };
  }
}
```

### 9.3 Data Validation

- **Aquarium Selection**: Ensure selected ID exists in aquarium list
- **Measurement Values**: Must be numbers, cannot be negative
- **Optimal Ranges**: Min must be less than max
- **Timestamps**: Must be valid ISO 8601 format

## 10. Error Handling

### 10.1 API Errors

1. **Authentication Errors (401)**
   - **Scenario**: User session expired
   - **Handling**: Redirect to login page
   - **User Message**: None (automatic redirect)

2. **Authorization Errors (403)**
   - **Scenario**: User tries to access another user's aquarium
   - **Handling**: Show error message, redirect to dashboard
   - **User Message**: "You don't have permission to view this aquarium"

3. **Not Found Errors (404)**
   - **Scenario**: Aquarium or measurements not found
   - **Handling**: Show appropriate empty state
   - **User Message**: Display empty state with action button

4. **Server Errors (500)**
   - **Scenario**: Backend service failure
   - **Handling**: Show error banner, allow retry
   - **User Message**: "Something went wrong. Please try again."

### 10.2 Data Errors

1. **Missing Optimal Values**
   - **Scenario**: Aquarium type has no optimal values defined
   - **Handling**: Show warning, display measurements without status
   - **User Message**: "Optimal ranges not configured for this aquarium type"

2. **Invalid Data Format**
   - **Scenario**: API returns malformed data
   - **Handling**: Log error, show error state
   - **User Message**: "Unable to load dashboard data. Please refresh."

3. **Network Errors**
   - **Scenario**: No internet connection
   - **Handling**: Show offline message, allow retry
   - **User Message**: "No internet connection. Please check your network."

### 10.3 Edge Cases

1. **No Parameters Defined**
   - **Handling**: Show message to contact support
   - **User Message**: "No parameters configured in system"

2. **Partial Measurements**
   - **Handling**: Show available parameters, mark missing as "no_data"
   - **User Message**: None (visual indication on cards)

3. **Very Old Measurements**
   - **Handling**: Display timestamp clearly, optionally show warning
   - **User Message**: "Last measurement: [timestamp]" with relative time

4. **Concurrent Aquarium Deletion**
   - **Handling**: Detect 404 on measurement fetch, reload aquarium list
   - **User Message**: "This aquarium was deleted. Selecting another."

### 10.4 Loading States

1. **Initial Load**
   - Show full-page skeleton with:
     - Skeleton header with selector placeholder
     - Grid of skeleton cards (6-8 placeholders)

2. **Aquarium Change**
   - Show skeleton cards only
   - Keep header visible

3. **Drawer Loading**
   - Show skeleton content in drawer
   - Keep parameter card highlighted

### 10.5 Accessibility Error Handling

- **Screen Reader Announcements**: Use ARIA live regions to announce errors
- **Focus Management**: Return focus to trigger element after error dismissal
- **Keyboard Navigation**: Ensure error messages are keyboard accessible

## 11. Implementation Steps

### Step 1: Create Type Definitions
1. Add `ParameterStatusViewModel` to `src/types.ts`
2. Add `DashboardViewModel` to `src/types.ts`
3. Add `DashboardEmptyStateType` to `src/types.ts`
4. Export all new types

### Step 2: Create API Client
1. Create `src/lib/api/dashboard.api.ts`
2. Implement `DashboardAPI` class with methods:
   - `getAquariums()`
   - `getLatestMeasurements(aquariumId)`
   - `getOptimalValues(aquariumTypeId)`
   - `getRecommendations(aquariumId, command)`
3. Add proper error handling and type annotations

### Step 3: Create Utility Functions
1. Create `src/lib/utils/parameter-status.ts`
2. Implement `calculateStatus()` function
3. Implement `calculateDeviation()` function
4. Implement `formatRelativeTime()` function for timestamps
5. Add unit tests for calculation logic

### Step 4: Create Custom Hook
1. Create `src/components/dashboard/hooks/useDashboard.ts`
2. Implement state management with `useState`:
   - aquariums, selectedAquariumId, measurements, optimalValues, parameters
   - isLoading, error, selectedParameterId, isDrawerOpen
3. Implement data fetching with `useEffect`:
   - Load aquariums on mount
   - Load measurements when aquarium changes
   - Load optimal values when aquarium changes
4. Implement calculation logic:
   - Combine measurements and optimal values into parameters
   - Calculate status for each parameter
5. Implement event handlers:
   - handleAquariumChange, handleParameterClick, handleDrawerClose
6. Add localStorage integration for selected aquarium

### Step 5: Create Empty State Components
1. Create `src/components/dashboard/NoAquariumsEmptyState.tsx`
2. Create `src/components/dashboard/NoMeasurementsEmptyState.tsx`
3. Use Shadcn/ui components for consistent styling
4. Add proper ARIA labels and semantic HTML

### Step 6: Create Aquarium Selector Component
1. Create `src/components/dashboard/AquariumSelector.tsx`
2. Use Shadcn/ui Select or custom dropdown component
3. Implement keyboard navigation (arrow keys, Enter, Escape)
4. Add ARIA attributes for accessibility
5. Style with Tailwind classes

### Step 7: Create Parameter Card Component
1. Create `src/components/dashboard/ParameterCard.tsx`
2. Use Shadcn/ui Card component
3. Implement status-based styling (border color, icon)
4. Add hover and focus states
5. Implement click handler
6. Add ARIA labels and role="button"
7. Make keyboard accessible (Enter/Space to activate)

### Step 8: Create Parameter Cards Grid Component
1. Create `src/components/dashboard/ParameterCardsGrid.tsx`
2. Implement responsive CSS Grid layout:
   - 1 column on mobile (`grid-cols-1`)
   - 2 columns on tablet (`md:grid-cols-2`)
   - 3 columns on desktop (`lg:grid-cols-3`)
3. Add gap between cards
4. Map parameters to ParameterCard components

### Step 9: Create AI Recommendation Drawer Component
1. Create `src/components/dashboard/AIRecommendationDrawer.tsx`
2. Implement drawer/sheet component (may use Shadcn/ui Sheet if available)
3. Add slide-in animation from right
4. Implement focus trap using focus-trap-react or similar
5. Add ESC key handler
6. Implement loading state skeleton
7. Display recommendation data with proper formatting
8. Add disclaimer at bottom
9. Ensure ARIA attributes for accessibility

### Step 10: Create Dashboard Header Component
1. Create `src/components/dashboard/DashboardHeader.tsx`
2. Layout with flex container
3. Include AquariumSelector and AddMeasurementButton
4. Optionally display last measurement time
5. Make responsive (stack on mobile)

### Step 11: Create Dashboard Content Component
1. Create `src/components/dashboard/DashboardContent.tsx`
2. Integrate useDashboard hook
3. Implement conditional rendering logic:
   - Loading skeleton
   - No aquariums empty state
   - No measurements empty state
   - Parameter cards grid
4. Include DashboardHeader
5. Include AIRecommendationDrawer
6. Add error boundary for graceful error handling

### Step 12: Create Loading Skeleton Components
1. Create `src/components/dashboard/DashboardSkeleton.tsx`
2. Create skeleton for header
3. Create skeleton cards grid (6-8 cards)
4. Use Tailwind animate-pulse for loading animation

### Step 13: Update Main Dashboard Page
1. Update `src/pages/index.astro`
2. Check authentication via middleware
3. Render DashboardContent with client:load directive
4. Pass necessary props from Astro context (userId if needed)

### Step 14: Add Measurement Form Modal (if not exists)
1. Create `src/components/measurements/MeasurementFormModal.tsx`
2. Implement form with fields for all parameters
3. Use Shadcn/ui Form components
4. Implement validation
5. Add submit handler to call bulk create endpoint
6. Emit event on successful save for parent to refresh

### Step 15: Implement AI Recommendation Endpoint (if needed)
1. Create `src/pages/api/aquariums/[aquariumId]/recommendations.ts`
2. Implement POST handler
3. Validate request body using Zod
4. Call AI service to generate recommendations
5. Return RecommendationDTO response

### Step 16: Styling and Polish
1. Apply consistent spacing using Tailwind
2. Ensure responsive design works on all breakpoints
3. Add transitions and animations:
   - Card hover effects
   - Drawer slide-in/out
   - Skeleton pulse
4. Test color contrast for accessibility
5. Ensure focus indicators are visible

### Step 17: Accessibility Testing
1. Test keyboard navigation through all interactive elements
2. Verify screen reader compatibility
3. Check focus trap in drawer
4. Ensure ARIA labels are descriptive
5. Test with keyboard only (no mouse)
6. Verify color contrast ratios meet WCAG AA standards

### Step 18: Error Handling Testing
1. Test all error scenarios:
   - Network failures
   - 401/403/404/500 responses
   - Missing data
   - Invalid data
2. Verify error messages are user-friendly
3. Test retry mechanisms

### Step 19: Integration Testing
1. Test complete user flows:
   - Login → View dashboard → Select aquarium → View parameters
   - Click parameter → View recommendations → Close drawer
   - Add measurement → Dashboard refreshes
2. Test empty states:
   - New user with no aquariums
   - User with aquarium but no measurements
3. Test with multiple aquariums and switching

### Step 20: Performance Optimization
1. Implement proper React.memo for components that don't need frequent re-renders
2. Use useCallback for event handlers passed to children
3. Use useMemo for expensive calculations (status calculation)
4. Consider implementing virtualization if parameter list is very long
5. Optimize API calls (debounce, cache, etc.)

### Step 21: Documentation
1. Add JSDoc comments to all components
2. Document props interfaces
3. Add README for dashboard component directory
4. Document custom hook usage
5. Add comments for complex business logic

### Step 22: Final Review and Testing
1. Code review with team
2. Test on different browsers (Chrome, Firefox, Safari, Edge)
3. Test on different devices (mobile, tablet, desktop)
4. Verify all acceptance criteria from user stories are met
5. Performance testing (Lighthouse, Web Vitals)
6. Security review (XSS, CSRF protection)

