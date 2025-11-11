# UI Architecture for Reef-Metrics

## 1. UI Structure Overview

The Reef-Metrics application is designed as a single-page application (SPA) with a main content area that dynamically renders different views. The structure is centered around a persistent layout featuring a side navigation panel for major sections (Dashboard, History) and a top bar for user-specific actions (aquarium switching, profile management, logout). This architecture ensures consistent navigation and a seamless user experience. The UI will be fully responsive, adapting to various screen sizes from mobile to desktop, and will prioritize accessibility standards (WCAG 2.1 AA).

## 2. View List

### 2.1. Login View
- **View Path:** `/login`
- **Main Purpose:** To allow users to authenticate and access their dashboard (US-002).
- **Key Information:** Email and password input fields.
- **Key View Components:**
    - Login form with fields for email and password.
    - "Log In" button.
    - Link to the registration view.
- **UX, Accessibility, and Security:**
    - **UX:** Clear error messages for failed login attempts (e.g., "Invalid credentials"). Autofocus on the email field.
    - **Accessibility:** Proper form labeling (`<label>`), input types (`type="email"`, `type="password"`), and ARIA attributes for validation feedback.
    - **Security:** All communication with the authentication endpoint will be over HTTPS.

### 2.2. Registration View
- **View Path:** `/register`
- **Main Purpose:** To allow new users to create an account (US-001).
- **Key Information:** Email and password input fields.
- **Key View Components:**
    - Registration form with fields for email and password.
    - "Register" button.
    - Link to the login view.
- **UX, Accessibility, and Security:**
    - **UX:** Real-time validation for password strength and email format. Clear success message upon registration.
    - **Accessibility:** Use of `aria-describedby` to associate validation messages with inputs.
    - **Security:** Enforce password complexity rules on the client-side as a preliminary check.

### 2.3. Dashboard View
- **View Path:** `/`
- **Main Purpose:** To provide an at-a-glance overview of the latest measurements for the selected aquarium (US-012). This is the main landing page after login.
- **Key Information:**
    - Latest measurement values for key parameters (e.g., Temperature, pH, Salinity).
    - Visual indicators for parameters that are outside their optimal range.
    - Name of the currently selected aquarium.
- **Key View Components:**
    - **Aquarium Selector:** A dropdown in the top bar to switch between aquariums (US-006).
    - **Parameter Cards:** A grid of cards, each representing a single parameter and its latest value.
    - **"Add Measurement" Button:** A primary call-to-action to open the bulk measurement form.
    - **AI Recommendation Drawer:** A slide-out panel to display AI-powered advice when a parameter card is clicked (US-013).
    - **Empty State:** A message displayed if the user has no aquariums (prompting to add one, US-005) or if the selected aquarium has no measurements.
- **UX, Accessibility, and Security:**
    - **UX:** Use skeleton loaders while data is being fetched. The grid layout adapts to a single column on mobile devices.
    - **Accessibility:** Parameter cards will be keyboard-focusable. The drawer will trap focus and be dismissible with the `Esc` key.
    - **Security:** Data is fetched for the authenticated user only.

### 2.4. Measurement History View
- **View Path:** `/history`
- **Main Purpose:** To allow users to view, edit, and delete past measurements in a detailed, paginated format (US-010, US-011, US-014).
- **Key Information:** A chronological list of all measurements for the selected aquarium.
- **Key View Components:**
    - **History Table:** A table displaying measurement date, parameter values, and action buttons.
    - **Pagination Controls:** To navigate through the measurement history.
    - **Edit/Delete Buttons:** For each measurement entry.
- **UX, Accessibility, and Security:**
    - **UX:** A confirmation dialog will appear before deleting a measurement to prevent accidental data loss.
    - **Accessibility:** The table will be structured semantically (`<thead>`, `<tbody>`, `<th>` with `scope` attributes) for screen reader compatibility.
    - **Security:** Users can only access and modify their own measurement data.

### 2.5. Profile View
- **View Path:** `/profile`
- **Main Purpose:** To allow users to manage their account settings, such as changing their password (US-004).
- **Key Information:** User's email address.
- **Key View Components:**
    - **Change Password Form:** Fields for the current password and the new password.
    - **Logout Button:** To end the user session (US-003).
- **UX, Accessibility, and Security:**
    - **UX:** Clear feedback on successful password change or errors.
    - **Accessibility:** All form fields will have proper labels.
    - **Security:** Requires the current password to authorize a password change.

## 3. User Journey Map

**Main Use Case: Daily Check-in and Measurement Entry**

1.  **Login:** The user opens the application and is presented with the `/login` view. They enter their credentials and are redirected to the main Dashboard (`/`).
2.  **Dashboard Review:** On the Dashboard, the user sees the latest measurements for their default aquarium. They notice the pH level is slightly off.
3.  **Switch Aquarium (Optional):** If the user has multiple aquariums, they can use the aquarium selector in the top bar to switch to a different one (US-006).
4.  **Get AI Advice:** The user clicks on the "pH" parameter card. A drawer slides out from the side, displaying an AI-generated recommendation on how to correct the pH level (US-013).
5.  **Add New Measurements:** The user performs new tests on their aquarium water. They click the "Add Measurement" button on the Dashboard.
6.  **Bulk Form Entry:** A modal or dedicated form appears, allowing the user to enter values for multiple parameters at once (US-009). They fill in the new values and save.
7.  **View Updated Dashboard:** The Dashboard automatically updates to display the newly added measurements.
8.  **Review History:** To see the trend over the last week, the user navigates to the `/history` view using the side navigation. They review the paginated table of past entries (US-014).
9.  **Logout:** The user clicks on their profile icon in the top bar and selects "Logout" from the dropdown menu, ending their session (US-003).

## 4. Layout and Navigation Structure

- **Main Layout:** A two-part structure composed of a fixed side navigation bar and a main content area. A top bar sits above the main content area.
    - **Side Navigation:** Always visible on desktop screens, potentially collapsible into a "hamburger" menu on mobile. It contains links to:
        - **Dashboard (`/`)**
        - **History (`/history`)**
    - **Top Bar:** Contains:
        - **Aquarium Selector:** A dropdown to switch the active aquarium (US-006).
        - **User Menu:** A dropdown menu triggered by a user avatar/icon, containing links to:
            - **Profile (`/profile`)**
            - **Logout**
- **Routing:** The application will use client-side routing managed by Astro to enable fast, seamless transitions between views without full page reloads.

## 5. Key Components

- **Aquarium Selector (`Select`):** A dropdown component used in the top bar for switching the active aquarium. It will be populated with data from the `GET /api/aquariums` endpoint.
- **Parameter Card (`Card`):** A reusable component to display a single parameter's name, value, and status (e.g., within/outside optimal range). Used in a grid on the Dashboard.
- **AI Recommendation Panel (`Drawer`):** A slide-out panel used to display contextual information, specifically for AI-generated recommendations (US-013). It will appear without navigating the user away from the current view.
- **Bulk Measurement Form:** A form with multiple input fields for adding several measurements at once (US-009). It will likely be presented in a modal dialog.
- **Global Error/Notification (`Toast`):** A non-intrusive pop-up component used for providing feedback, such as API errors or success messages (e.g., "Measurement saved successfully").
- **Loading Indicators (`Spinner`, `Skeleton`):** Used to improve perceived performance during data fetching. Skeletons will mimic the layout of content (e.g., parameter cards) before it loads.
- **Confirmation Dialog:** A modal dialog that prompts the user for confirmation before executing a destructive action, such as deleting a measurement or an aquarium (US-008, US-011).

