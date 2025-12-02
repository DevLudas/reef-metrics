# View Implementation Plan: Aquariums Management

## 1. Overview
This document outlines the implementation plan for the Aquariums Management View. This view serves as a central hub for users to manage their aquariums, allowing them to view a list of all their tanks, and perform Create, Update, and Delete operations. The view will be accessible via the main application navigation and will handle cases such as users having no aquariums, redirecting them to an onboarding page.

## 2. View Routing
- **Path**: `/aquariums`
- **File**: `src/pages/aquariums.astro`

## 3. Component Structure
The view will be composed of the following component hierarchy:

```
Layout.astro
└── AppHeader.astro
    └── AquariumSelector.tsx
└── aquariums.astro (Page)
    └── AquariumGrid.tsx
        ├── AquariumCard.tsx
        │   ├── DropdownMenu (Shadcn/ui)
        │   └── DeleteConfirmationDialog.tsx
        └── AddAquariumButton.tsx
            └── AquariumFormModal.tsx
                ├── AquariumForm.tsx
                └── Dialog (Shadcn/ui)
```

## 4. Component Details

### `aquariums.astro`
- **Component description**: The main Astro page for the view. It fetches the list of aquariums for the current user on the server and passes them to the `AquariumGrid` client component. It also handles the redirect to `/onboarding` if the user has no aquariums.
- **Main elements**: `<Layout>`, `<AquariumGrid>`
- **Handled interactions**: None (server-side logic only).
- **Handled validation**: Checks if the fetched aquarium list is empty and redirects if so.
- **Types**: `Aquarium[]`
- **Props**: None.

### `AquariumGrid.tsx`
- **Component description**: A client-side component that displays the grid of aquariums. It manages the state of the aquarium list and orchestrates interactions for adding, editing, and deleting aquariums.
- **Main elements**: `div` (grid container), `AquariumCard`, `AddAquariumButton`.
- **Handled interactions**:
  - Receives `onAquariumAdded` event from `AddAquariumButton` to add a new aquarium to the state.
  - Receives `onAquariumUpdated` event from `AquariumCard` to update an aquarium in the state.
  - Receives `onAquariumDeleted` event from `AquariumCard` to remove an aquarium from the state.
- **Handled validation**: None.
- **Types**: `Aquarium[]`
- **Props**: `initialAquariums: Aquarium[]`

### `AquariumCard.tsx`
- **Component description**: Displays a single aquarium's information (name, type, volume) and provides actions (Edit, Delete, View Details) via a dropdown menu.
- **Main elements**: `<Card>`, `<a>` (for details link), `<DropdownMenu>`, `<DeleteConfirmationDialog>`, `<AquariumFormModal>`.
- **Handled interactions**:
  - **Edit**: Opens the `AquariumFormModal` pre-filled with the aquarium's data.
  - **Delete**: Opens the `DeleteConfirmationDialog`. On confirmation, it calls the delete API and emits an `onAquariumDeleted` event.
  - **View Details**: Navigates the user to `/aquariums/[id]`.
- **Handled validation**: None.
- **Types**: `Aquarium`
- **Props**: `aquarium: Aquarium`, `onAquariumUpdated: (aquarium: Aquarium) => void`, `onAquariumDeleted: (id: string) => void`.

### `AddAquariumButton.tsx`
- **Component description**: A button that, when clicked, opens the `AquariumFormModal` to allow the user to add a new aquarium.
- **Main elements**: `<Button>`, `<AquariumFormModal>`.
- **Handled interactions**:
  - **Click**: Toggles the visibility of the `AquariumFormModal`.
  - Receives `onAquariumAdded` event from the modal and propagates it to the parent `AquariumGrid`.
- **Handled validation**: None.
- **Types**: `Aquarium`
- **Props**: `onAquariumAdded: (aquarium: Aquarium) => void`.

### `AquariumFormModal.tsx`
- **Component description**: A modal dialog containing the `AquariumForm`. It is used for both creating and editing an aquarium. It handles the form submission state (loading, error) and communicates with the API.
- **Main elements**: `<Dialog>`, `<AquariumForm>`.
- **Handled interactions**:
  - **Submit**: Receives form data from `AquariumForm`, calls the appropriate API endpoint (POST for create, PUT for edit), and emits `onAquariumAdded` or `onAquariumUpdated` on success.
- **Handled validation**: Manages submission state based on form validity and API responses.
- **Types**: `Aquarium`, `AquariumDTO`
- **Props**: `aquariumToEdit?: Aquarium`, `onAquariumAdded: (aquarium: Aquarium) => void`, `onAquariumUpdated: (aquarium: Aquarium) => void`, `isOpen: boolean`, `setIsOpen: (isOpen: boolean) => void`.

### `AquariumForm.tsx`
- **Component description**: The actual form with input fields for aquarium data (name, type, volume, description). It uses `zod` for validation and `react-hook-form`.
- **Main elements**: `<form>`, `<Input>`, `<Select>`, `<Textarea>`.
- **Handled interactions**:
  - **Submit**: Validates the form data and passes it to the parent `AquariumFormModal`.
- **Handled validation**:
  - `name`: Required, string, 3-50 characters.
  - `aquariumTypeId`: Required, string (UUID).
  - `volume`: Required, number, > 0.
  - `description`: Optional, string, max 255 characters.
- **Types**: `AquariumDTO`, `AquariumType[]`
- **Props**: `onSubmit: (data: AquariumDTO) => void`, `initialData?: AquariumDTO`, `aquariumTypes: AquariumType[]`.

### `DeleteConfirmationDialog.tsx`
- **Component description**: A modal dialog that asks the user for confirmation before deleting an aquarium.
- **Main elements**: `<Dialog>`.
- **Handled interactions**:
  - **Confirm**: Executes the delete callback function.
- **Handled validation**: None.
- **Types**: None.
- **Props**: `onConfirm: () => void`, `isOpen: boolean`, `setIsOpen: (isOpen: boolean) => void`.

## 5. Types

### `Aquarium` (from `src/types.ts`)
The core entity type representing an aquarium, fetched from the API.
```typescript
export type Aquarium = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  volume: number;
  aquariumTypeId: string;
  createdAt: string;
  updatedAt: string;
};
```

### `AquariumDTO` (from `src/types.ts`)
The Data Transfer Object used for the request body when creating or updating an aquarium.
```typescript
export type AquariumDTO = {
  name: string;
  description: string | null;
  volume: number;
  aquariumTypeId: string;
};
```

### `AquariumType` (from `src/types.ts`)
Represents the type of an aquarium (e.g., "Mixed Reef"), used to populate the form's select input.
```typescript
export type AquariumType = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};
```

## 6. State Management
State will be managed locally within the React components using `useState` hooks. No global state or complex state management libraries are required.

- **`AquariumGrid.tsx`**: Will use a state variable `const [aquariums, setAquariums] = useState<Aquarium[]>(initialAquariums);` to manage the list of aquariums displayed. This state will be updated via handler functions (`handleAquariumAdded`, `handleAquariumUpdated`, `handleAquariumDeleted`) that are passed down as props.
- **`AquariumFormModal.tsx` / `DeleteConfirmationDialog.tsx`**: The open/closed state of these modals will be managed by their parent components (`AddAquariumButton` and `AquariumCard` respectively) using a `useState` hook, e.g., `const [isModalOpen, setIsModalOpen] = useState(false);`.
- **Custom Hooks**: No new custom hooks are required. `react-hook-form` will be used for form state management.

## 7. API Integration

- **`GET /api/aquariums`**:
  - **Action**: Fetched server-side in `src/pages/aquariums.astro` to get the initial list of aquariums for the logged-in user.
  - **Response Type**: `Aquarium[]`

- **`GET /api/aquarium-types`**:
  - **Action**: Fetched client-side within the `AquariumForm` component to populate the aquarium type dropdown.
  - **Response Type**: `AquariumType[]`

- **`POST /api/aquariums`**:
  - **Action**: Called from `AquariumFormModal` when creating a new aquarium.
  - **Request Type**: `AquariumDTO`
  - **Response Type**: `Aquarium`

- **`PUT /api/aquariums/[id]`**:
  - **Action**: Called from `AquariumFormModal` when updating an existing aquarium.
  - **Request Type**: `AquariumDTO`
  - **Response Type**: `Aquarium`

- **`DELETE /api/aquariums/[id]`**:
  - **Action**: Called from `DeleteConfirmationDialog` (triggered from `AquariumCard`) to delete an aquarium.
  - **Response Type**: `204 No Content`

## 8. User Interactions
- **Viewing Aquariums**: The user navigates to `/aquariums` and sees a grid of their aquariums. If they have no aquariums, they are redirected to `/onboarding`.
- **Adding an Aquarium**:
  1. User clicks the "Add Aquarium" button.
  2. The `AquariumFormModal` opens.
  3. User fills in the form and clicks "Save".
  4. The form is validated. On success, a `POST` request is sent.
  5. The modal closes, and the new aquarium appears in the grid without a page reload.
- **Editing an Aquarium**:
  1. User clicks the "Edit" option in the dropdown menu on an `AquariumCard`.
  2. The `AquariumFormModal` opens, pre-populated with that aquarium's data.
  3. User modifies the data and clicks "Save".
  4. A `PUT` request is sent. On success, the modal closes and the card updates in the grid.
- **Deleting an Aquarium**:
  1. User clicks the "Delete" option in the dropdown menu on an `AquariumCard`.
  2. The `DeleteConfirmationDialog` opens to prevent accidental deletion.
  3. User clicks "Confirm".
  4. A `DELETE` request is sent. On success, the dialog closes and the card is removed from the grid.

## 9. Conditions and Validation
- **No Aquariums**: The `aquariums.astro` page will check if the user has any aquariums. If the list is empty, it will perform a server-side redirect to the `/onboarding` page.
- **Form Validation**: The `AquariumForm` will perform client-side validation using `zod` and `react-hook-form` before submission is enabled.
  - `name`: Must be a string between 3 and 50 characters.
  - `aquariumTypeId`: Must be a valid UUID string selected from the dropdown.
  - `volume`: Must be a positive number.
  - `description`: Must not exceed 255 characters.
- **API Authorization**: All API endpoints are protected and require an authenticated user session. This is handled by the Astro middleware.

## 10. Error Handling
- **API Request Failures**: All client-side `fetch` calls will be wrapped in `try...catch` blocks. In case of an error (e.g., 4xx, 5xx status codes), a toast notification will be displayed with a user-friendly message (e.g., "Failed to add aquarium. Please try again."). The error will be logged to the console for debugging.
- **Validation Errors**: `react-hook-form` will display validation error messages inline, next to the corresponding form fields. The form's submit button will be disabled until the form is valid.
- **Deletion Confirmation**: To prevent accidental data loss, a confirmation dialog is required before executing a delete operation.

## 11. Implementation Steps
1.  **Create Page File**: Create the Astro page at `src/pages/aquariums.astro`.
2.  **Server-Side Logic**: In `aquariums.astro`, implement the server-side script to fetch the user's aquariums using `Astro.locals.supabase`. Add the logic to redirect to `/onboarding` if the aquarium list is empty.
3.  **Create `AquariumGrid.tsx`**: Develop the main grid component in `src/components/dashboard/`. It should accept `initialAquariums` as a prop and manage the aquarium list in its state using `useState`.
4.  **Create `AquariumCard.tsx`**: Build the card component. Implement the dropdown menu using `shadcn/ui` with "Edit", "Delete", and "Details" (`<a>` tag) actions.
5.  **Create `AddAquariumButton.tsx`**: Create the button component that will manage the state for and trigger the opening of the add/edit modal.
6.  **Create `AquariumForm.tsx`**: Implement the reusable form with `react-hook-form` and `zod` for validation. Fetch `aquariumTypes` within this component to populate the select input.
7.  **Create `AquariumFormModal.tsx`**: Build the modal component that wraps `AquariumForm`. Implement the logic for handling both create (`POST`) and edit (`PUT`) operations, including API calls and calling the appropriate `on...` prop on success.
8.  **Create `DeleteConfirmationDialog.tsx`**: Implement the confirmation dialog for the delete action using `shadcn/ui`.
9.  **Integrate Components**: In `aquariums.astro`, render the `<AquariumGrid />` component, passing the fetched aquariums as the `initialAquariums` prop. Wire up the components with the necessary props and event handlers.
10. **Styling**: Apply Tailwind CSS classes to all new components to ensure they are responsive and match the application's design system.
11. **Testing**: Manually test all user stories: adding, editing, and deleting aquariums. Verify the redirect for new users. Check for responsiveness and accessibility compliance.

