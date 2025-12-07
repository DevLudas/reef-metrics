# Authentication Module Technical Specification

This document outlines the technical architecture for implementing user registration, login, and password recovery functionality in the ReefMetrics application, based on the requirements from the PRD (US-001 to US-005) and the defined tech stack.

## 1. User Interface Architecture

### 1.1. New Pages and Layouts

-   **`src/pages/login.astro`**: A new page for user login. It will contain a form for email and password.
-   **`src/pages/register.astro`**: A new page for user registration. It will include a form for username, email, password, and password confirmation.
-   **`src/pages/forgot-password.astro`**: A page for users who have forgotten their password, with a form to enter their email address.
-   **`src/pages/reset-password.astro`**: A page for resetting the password, accessed via a link from the email. It will contain a form for the new password and its confirmation.
-   **`src/layouts/AuthLayout.astro`**: A dedicated layout for authentication pages (`login`, `register`, `forgot-password`, `reset-password`) to provide a consistent and simple interface, separate from the main application layout.

### 1.2. Component Architecture

#### React Components (Client-Side Interactivity)

-   **`src/components/auth/LoginForm.tsx`**: A React component for the login form. It will handle form state, validation, and submission.
-   **`src/components/auth/RegisterForm.tsx`**: A React component for the registration form, managing state, validation, and submission.
-   **`src/components/auth/ForgotPasswordForm.tsx`**: A React component for the "forgot password" form.
-   **`src/components/auth/ResetPasswordForm.tsx`**: A React component for the password reset form.

#### Astro Components (Static Content and Structure)

-   **`src/components/AppHeader.astro`**: This component will be updated to conditionally display "Login" and "Register" buttons for unauthenticated users, and the `UserMenu` for authenticated users.
-   **`src/pages/index.astro`**: The home page will be updated to redirect authenticated users to the `/dashboard` page.
-   **`src/pages/dashboard.astro`**: A new page that will serve as the main dashboard for authenticated users. It will be responsible for fetching and displaying user-specific data.

### 1.3. Validation and Error Handling

-   **Client-Side Validation**: The React forms will use `zod` and `react-hook-form` for real-time validation of input fields (e.g., email format, password complexity, password match).
-   **Error Messages**: User-friendly error messages will be displayed below the respective form fields.
-   **Server Errors**: Errors returned from the API (e.g., "Invalid credentials", "Email already in use") will be displayed in a general error message area within the form.

### 1.4. Scenarios

-   **Unauthenticated User**:
    -   Sees "Login" and "Register" buttons in the `AppHeader`.
    -   Access to `login.astro`, `register.astro`, `forgot-password.astro`, and `reset-password.astro` pages.
    -   Redirected from protected pages (e.g., `/dashboard`, `/profile`) to `/login`.
-   **Authenticated User**:
    -   Sees the `UserMenu` in the `AppHeader`.
    -   Redirected from `/login` and `/register` to `/dashboard`.
    -   Can access protected pages.

## 2. Backend Logic

### 2.1. API Endpoints

The following API endpoints will be created in the `src/pages/api/auth` directory:

-   **`POST /api/auth/register`**: Handles user registration.
-   **`POST /api/auth/login`**: Manages user login.
-   **`POST /api/auth/logout`**: Handles user logout (already partially implemented).
-   **`POST /api/auth/forgot-password`**: Initiates the password reset process.
-   **`POST /api/auth/reset-password`**: Completes the password reset process.

### 2.2. Data Models and Validation

-   **Zod Schemas**: New Zod schemas will be created in `src/lib/validation/auth.validation.ts` to validate the input for each authentication endpoint.
    -   `registerSchema`: Validates `username`, `email`, `password`, and `confirmPassword`.
    -   `loginSchema`: Validates `email` and `password`.
    -   `forgotPasswordSchema`: Validates `email`.
    -   `resetPasswordSchema`: Validates `token`, `password`, and `confirmPassword`.
-   **Data Transfer Objects (DTOs)**: The existing DTOs in `src/types.ts` will be used for structuring data in API responses.

### 2.3. Exception Handling

-   API endpoints will use `try...catch` blocks to handle errors.
-   Specific error messages will be returned for different failure scenarios (e.g., invalid input, user not found, email already exists).
-   HTTP status codes will be used appropriately (e.g., `400` for bad requests, `401` for unauthorized, `409` for conflicts, `500` for server errors).

### 2.4. Server-Side Rendering (SSR)

-   The `astro.config.mjs` is already configured for `output: "server"`, which is correct.
-   Protected pages like `/dashboard` and `/profile` will check for an active user session on the server. If no session exists, they will redirect to `/login`. This will be handled in the Astro page's frontmatter.

## 3. Authentication System

### 3.1. Supabase Auth Integration

-   **Supabase Client**: The existing Supabase client in `src/db/supabase.client.ts` will be used.
-   **Auth Service**: The `src/lib/services/auth.service.ts` will be extended to include methods for:
    -   `signUp(command: SignUpCommand)`
    -   `signIn(command: SignInCommand)`
    -   `sendPasswordResetEmail(email: string)`
    -   `updatePassword(command: UpdatePasswordCommand)`
-   **Middleware**: The middleware in `src/middleware/index.ts` will be updated to manage the user's session. It will verify the session cookie on each request and attach the user's information to `context.locals`.

### 3.2. Key Implementation Details

-   **Registration**: The `signUp` method in `AuthService` will use `supabase.auth.signUp`.
-   **Login**: The `signIn` method will use `supabase.auth.signInWithPassword`.
-   **Logout**: The `signOut` method will use `supabase.auth.signOut`.
-   **Password Reset**:
    -   `sendPasswordResetEmail` will use `supabase.auth.resetPasswordForEmail`.
    -   `updatePassword` will use the user's access token to call `supabase.auth.updateUser`.
-   **Session Management**: Supabase's cookie-based session management will be used. The middleware will be responsible for refreshing the session if necessary.
-   **User Profile**: Upon registration, a corresponding entry in the `profiles` table in Supabase will be created to store user-specific information like the username. This will be handled using a database trigger on the `auth.users` table.

