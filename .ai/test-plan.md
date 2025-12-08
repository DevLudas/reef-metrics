# Test Plan for ReefMetrics Application

### 1. Introduction and Goals

#### 1.1. Introduction
This document outlines the testing strategy for the ReefMetrics application. ReefMetrics is a web application designed to help aquarium enthusiasts track water parameters, manage their aquariums, and receive AI-powered recommendations. The application is built with Astro for server-side rendering and React for client-side interactivity, with Supabase as the backend service and OpenRouter for AI features. This plan details the scope, methods, resources, and schedule for all testing activities.

#### 1.2. Testing Goals
The primary goals of the testing process are to:
*   **Ensure Functionality:** Verify that all features, including Aquarium Management, Measurement Tracking, Dashboard, and AI Recommendations, work as expected.
*   **Guarantee Reliability & Stability:** Ensure the application is stable, handles errors gracefully, and performs reliably under expected user loads.
*   **Validate Data Integrity:** Confirm that data is correctly created, read, updated, deleted, and validated throughout the application stack.
*   **Verify API Correctness:** Ensure all API endpoints are secure, reliable, and adhere to their contracts.
*   **Identify and Report Defects:** Discover and document software defects to be addressed before release.
*   **Confirm User Experience:** Ensure the user interface is intuitive and the key user flows are smooth and efficient.

### 2. Scope of Testing

#### 2.1. In-Scope Features
*   **Authentication Module:** User registration, login, password reset flows.
*   **Aquarium Management (CRUD):** Creating, viewing, updating, and deleting aquariums.
*   **Measurement Management (CRUD):**
    *   Adding single and bulk measurements.
    *   Listing, filtering, and paginating measurements.
    *   Viewing latest measurements and historical data.
    *   Updating and deleting measurements.
*   **Dashboard:**
    *   Display of parameter statuses (Normal, Warning, Critical, No Data).
    *   Correct data aggregation and presentation via `DashboardService`.
    *   Aquarium selection and data refresh.
    *   Empty states (no aquariums, no measurements).
*   **AI Recommendations:**
    *   Fetching and displaying AI analysis for out-of-range parameters.
    *   Handling of loading, success, and error states for the AI service integration.
*   **API Endpoints:** All endpoints under `/pages/api/` will be tested for functionality, validation, error handling, and security.
*   **Frontend Components:** All interactive React components will be tested for functionality and state management.

#### 2.2. Out-of-Scope Features
*   **Third-Party Infrastructure Testing:** We will not test the internal infrastructure of Supabase or OpenRouter. Our scope is limited to testing the *integration* with these services.
*   **Exhaustive Performance & Load Testing:** While basic performance will be observed, comprehensive load and stress testing are out of scope for the initial phase.
*   **UI/UX Design Testing:** This plan focuses on functional testing. While obvious UI/UX issues will be reported, detailed design verification is out of scope.
*   **Third-party UI Library Testing:** We assume the underlying UI components from Radix UI and other libraries are functionally correct.

### 3. Types of Testing
A multi-layered testing approach will be adopted to ensure comprehensive coverage.

*   **Unit Testing:** To verify individual functions and modules in isolation.
    *   **Targets:** Utility functions (`parameter-status.ts`), Zod validation schemas, individual methods within services (`*.service.ts`) with mocked dependencies (e.g., Supabase client).
*   **Integration Testing:** To test the interaction between different parts of the application.
    *   **Targets:** Service layer integration with the Supabase database, API endpoints' interaction with their respective services.
*   **API Testing:** To test the full functionality of the API layer independently of the UI.
    *   **Targets:** All REST endpoints. Tests will cover happy paths, error responses (4xx, 5xx), input validation, and correct HTTP status codes and response bodies.
*   **Component Testing:** To test individual React components in isolation.
    *   **Targets:** Interactive components like `AquariumForm.tsx` and `AddMeasurementForm.tsx` to verify their state, event handling, and rendering based on props.
*   **End-to-End (E2E) Testing:** To simulate real user scenarios from start to finish.
    *   **Targets:** Critical user flows such as user registration -> creating an aquarium -> adding measurements -> viewing the dashboard.
*   **Security Testing:** To identify basic security vulnerabilities.
    *   **Targets:** API endpoint authorization (once real authentication is implemented), input validation to prevent common vulnerabilities.
*   **Compatibility Testing:** To ensure the application works correctly across different browsers.
    *   **Targets:** Latest versions of Chrome, Firefox, and Safari on desktop.

### 4. Test Scenarios (High-Level)

#### 4.1. Aquarium Management
*   **TC-AQ-01:** A user can successfully create a new aquarium with all required and optional fields.
*   **TC-AQ-02:** A user cannot create an aquarium with invalid data (e.g., name too short, non-positive volume).
*   **TC-AQ-03:** A user can view a list of their aquariums.
*   **TC-AQ-04:** A user can edit an existing aquarium's details.
*   **TC-AQ-05:** A user can delete an aquarium, and a confirmation dialog is shown.

#### 4.2. Measurement Management
*   **TC-MM-01:** A user can add a single measurement for a parameter in their aquarium.
*   **TC-MM-02:** A user can add multiple measurements at once using the bulk creation form.
*   **TC-MM-03:** The system rejects measurements with invalid values (e.g., negative numbers).
*   **TC-MM-04:** The dashboard correctly displays the latest measurement for each parameter.

#### 4.3. Dashboard & AI Recommendations
*   **TC-DASH-01:** The dashboard correctly displays parameter cards with calculated status (Normal, Warning, Critical) based on the latest measurements.
*   **TC-DASH-02:** The dashboard displays an empty state when a user has no aquariums.
*   **TC-DASH-03:** The dashboard displays an empty state when an aquarium has no measurements.
*   **TC-DASH-04:** A user can switch between different aquariums, and the dashboard updates accordingly.
*   **TC-DASH-05:** Clicking a parameter card with a non-"normal" status opens the AI Recommendation drawer.
*   **TC-DASH-06:** The AI drawer correctly handles and displays loading and error states from the OpenRouter API.

### 5. Test Environment
*   **Test Database:** A separate Supabase project will be used for all testing activities to avoid polluting the production database. This database will be seeded with a predefined set of data before test runs.
*   **Test APIs:** A dedicated, rate-limit-friendly API key for OpenRouter will be used for the test environment.
*   **Staging Environment:** All tests will be executed in a dedicated staging environment that is a close replica of the production setup.

### 6. Testing Tools
*   **Unit & Integration Testing:** **Vitest** - It is modern, fast, and integrates well with Vite-based projects like Astro.
*   **E2E & API Testing:** **Playwright** - Excellent choice for modern web applications. It provides robust APIs for browser automation, network request interception, and API testing.
*   **Component Testing:** **Storybook** - To visually test and document UI components in isolation.
*   **Bug Tracking:** **GitHub Issues** - To report, track, and manage defects within the project repository.

### 7. Test Schedule
Testing will be an integral part of the development lifecycle.
*   **Phase 1 (During Development):** Developers write unit and integration tests for new features.
*   **Phase 2 (Feature Completion):** QA performs API testing and starts creating E2E tests for the completed feature branch.
*   **Phase 3 (Pre-Release):** A full regression suite (automated E2E tests and critical manual tests) is executed on the staging environment before deployment to production.

### 8. Test Acceptance Criteria

#### 8.1. Entry Criteria
*   The feature is code-complete and has been peer-reviewed.
*   All related unit and integration tests are passing.
*   The build is successfully deployed to the designated test environment.

#### 8.2. Exit Criteria
*   **Automated Tests:** 100% of all automated tests in the regression suite must pass.
*   **Manual Tests:** All high-priority manual test cases must pass.
*   **Defects:** No "Critical" or "High" severity bugs are open.
*   **Coverage:** Test cases cover all user stories and requirements for the release.

### 9. Roles and Responsibilities
*   **Developers:**
    *   Writing and maintaining unit and integration tests.
    *   Performing initial testing on their features.
    *   Fixing bugs reported by the QA team.
*   **QA Engineer:**
    *   Creating and maintaining this Test Plan.
    *   Developing and executing API, E2E, and manual test cases.
    *   Reporting and managing defects.
    *   Providing a final sign-off for release.
*   **Project Manager:**
    *   Prioritizing features for testing.
    *   Assisting in prioritizing bug fixes.
    *   Making the final release decision based on test reports.

### 10. Bug Reporting Procedures
All defects will be logged in GitHub Issues using a standardized template.

*   **Bug Title:** A clear, concise summary of the issue.
*   **Description:** Detailed explanation of the bug.
*   **Steps to Reproduce:** A numbered list of steps to trigger the bug.
*   **Expected Result:** What the application should have done.
*   **Actual Result:** What the application actually did.
*   **Severity:**
    *   **Critical:** Blocks core functionality, data loss, security breach.
    *   **High:** Major feature is broken or unusable.
    *   **Medium:** Minor feature is broken, or a major feature has a workaround.
    *   **Low:** Cosmetic issue, typo, or minor inconvenience.
*   **Attachments:** Screenshots, videos, or logs.
*   **Environment:** Browser, OS, and other relevant details.

**Bug Lifecycle:** New -> Assigned -> In Progress -> Ready for Retest -> Closed / Reopened.