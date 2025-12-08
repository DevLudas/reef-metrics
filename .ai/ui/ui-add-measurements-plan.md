# UI Architecture for Reef Metrics

## 1. UI Structure Overview

The Reef Metrics UI is designed as a responsive, server-driven application using Astro for static layouts and React for interactive components. The architecture prioritizes a clear, state-less user experience by fetching data on-demand for each view and managing the application state (like the currently selected aquarium) through URL query parameters. This approach ensures deep linking, straightforward navigation, and avoids the complexity of client-side state management libraries.

The structure is centered around a few key views:

- **Onboarding**: For new users or users without any aquariums.
- **Dashboard**: The main hub for viewing the latest measurements and AI recommendations.
- **Aquariums Management**: A central place to view, add, edit, and delete aquariums.
- **Aquarium Detail**: A dedicated view for managing a single aquarium's settings and custom parameters.

Navigation is handled through a main application header, with contextual actions (like adding/editing) available within specific views. Reusable components like modals, forms, and cards ensure a consistent and maintainable user interface.

## 2. View List

### Onboarding View

- **View Path**: `/onboarding`
- **Main Purpose**: To guide new users or users without any aquariums through the process of adding their first tank.
- **Key Information to Display**: A welcoming message and a form to add a new aquarium.
- **Key View Components**:
  - `OnboardingForm` (React component)
  - `AppHeader` (Astro layout component)
- **UX, Accessibility, and Security Considerations**:
  - **UX**: The form should be simple and provide clear instructions. Upon successful submission, the user is redirected to the dashboard for the newly created aquarium.
  - **Accessibility**: All form fields will have associated labels. The form will be keyboard-navigable with clear focus indicators.
  - **Security**: Input data is validated on the client and server-side using Zod schemas.

### Aquariums Management View

- **View Path**: `/aquariums`
- **Main Purpose**: To allow users to manage all their aquariums from a single interface.
- **Key Information to Display**: A grid or list of all user-owned aquariums, each showing its name, type, and key details.
- **Key View Components**:
  - `AppHeader`
  - `AquariumCard` (displays individual aquarium info)
  - `AddAquariumButton`
  - `AquariumFormModal` (for adding/editing)
  - `DeleteConfirmationDialog`
- **UX, Accessibility, and Security Considerations**:
  - **UX**: A responsive grid of cards provides a clear overview. Destructive actions like deletion require user confirmation through a modal dialog.
  - **Accessibility**: Each card will be a navigable element. Action buttons (`Edit`, `Delete`) will have accessible labels (e.g., `aria-label="Edit Sunset Reef"`).
  - **Security**: Deletion is a protected action requiring confirmation to prevent accidental data loss. All operations are authenticated.

### Aquarium Detail View

- **View Path**: `/aquariums/[id]`
- **Main Purpose**: To provide a detailed view and configuration options for a single aquarium.
- **Key Information to Display**:
  - General aquarium information (name, type, description, volume).
  - A tabbed interface for "Details" and "Target Parameters".
  - A form to edit the aquarium's general information.
  - A form to customize the optimal ranges for water parameters.
- **Key View Components**:
  - `AppHeader`
  - `TabbedInterface` (React component)
  - `AquariumForm` (for editing details)
  - `OptimalParametersForm`
- **UX, Accessibility, and Security Considerations**:
  - **UX**: The tabbed interface cleanly separates general settings from parameter configuration. Saving custom parameter ranges provides a "Preview Impact" to show the user the consequences of their changes.
  - **Accessibility**: Tabs will be implemented using ARIA roles (`tablist`, `tab`, `tabpanel`) for screen reader compatibility.
  - **Security**: All changes are validated on the server. The view is accessible only to the owner of the aquarium.

## 3. User Journey Map

The primary user journey revolves around managing and monitoring aquariums.

1.  **New User Registration**:
    - User signs up and logs in for the first time.
    - The system detects the user has no aquariums.
    - User is automatically redirected to the **Onboarding View** (`/onboarding`).
    - User fills out the form to add their first aquarium.
    - On success, the user is redirected to the **Dashboard View** (`/?aquariumId=...`), which displays the empty state for their new aquarium.

2.  **Existing User - Daily Monitoring**:
    - User logs in and lands on the **Dashboard View** (`/`).
    - The view defaults to the first aquarium in their list or the one specified in the URL query parameter.
    - User reviews the `ParameterCardsGrid`.
    - User clicks `AddMeasurementButton` to open the `AddMeasurementForm`.
    - User enters new measurements and submits the form.
    - The `ParameterCardsGrid` updates to show the new data.

3.  **Existing User - Managing Aquariums**:
    - From the `AppHeader`, the user navigates to the **Aquariums Management View** (`/aquariums`).
    - The user sees a grid of their aquariums.
    - **To Add**: User clicks `AddAquariumButton`, which opens the `AquariumFormModal`. They fill it out and submit, and the new aquarium appears in the grid.
    - **To Edit**: User clicks the "Edit" button on an `AquariumCard`. The `AquariumFormModal` opens, pre-populated with data. They make changes and save.
    - **To Delete**: User clicks the "Delete" button. A `DeleteConfirmationDialog` appears. Upon confirmation, the aquarium is removed. If it was the last one, the user is redirected to `/onboarding`.
    - **To View Details**: User clicks the "Details" link on an `AquariumCard` and is taken to the **Aquarium Detail View** (`/aquariums/[id]`).

## 4. Layout and Navigation Structure

The application uses a simple and consistent navigation structure anchored by a global `AppHeader`.

- **`AppHeader`**: This persistent component is present on all views and contains:
  - **Logo**: Links back to the main **Dashboard View** (`/`).
  - **Aquarium Selector**: A dropdown menu that allows users to switch between their aquariums. Selecting an aquarium reloads the current view with the corresponding `aquariumId` in the URL. This is the primary method of context switching.
  - **Main Navigation Links**:
    - `Dashboard`: Links to `/`.
    - `Aquariums`: Links to `/aquariums`.
  - **User Menu**: A dropdown with links to "Profile" and "Logout".

- **URL-Driven State**: The application's state is managed via URL query parameters (e.g., `?aquariumId=...`). This eliminates the need for global state, enables deep linking, and makes the application's behavior predictable with browser back/forward buttons.

- **Contextual Navigation**: Actions like "Edit," "Delete," or "Add" are presented within the context of the view (e.g., on an `AquariumCard` or as a primary button on a management screen) rather than in the global navigation bar.

## 5. Key Components

These are reusable components that form the building blocks of the UI, ensuring consistency and promoting code reuse.

- **`AppHeader.astro`**: The main site-wide navigation component containing the logo, aquarium selector, and user menu.
- **`AquariumSelector.tsx`**: A dropdown component used within the `AppHeader` to list and switch between a user's aquariums. It includes an "Add New Aquarium" option.
- **`AquariumFormModal.tsx`**: A shared modal component used for both adding a new aquarium and editing an existing one. It contains the form fields (name, type, description, volume) and handles submission logic.
- **`ParameterCardsGrid.tsx`**: A responsive grid that displays a collection of `ParameterCard` components, showing the latest measurement for each water parameter.
- **`ParameterCard.tsx`**: A card that displays the name, value, and status (e.g., "Optimal") of a single water parameter.
- **`AddMeasurementForm.tsx`**: A form (likely in a modal or sheet) that allows users to submit new measurements for multiple parameters at once.
- **`DeleteConfirmationDialog.tsx`**: A reusable modal dialog that asks the user for confirmation before performing a destructive action, such as deleting an aquarium or a measurement.
- **`DashboardSkeleton.tsx`**: A loading state component that mimics the layout of the dashboard, providing a better user experience while data is being fetched.
