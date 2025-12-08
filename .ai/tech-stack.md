## Frontend – Astro with React for interactive components:

- Astro 5 allows building fast, efficient websites and applications with minimal JavaScript.
- React 19 provides interactivity where needed.
- TypeScript 5 enables static code typing and better IDE support.
- Tailwind 4 allows convenient application styling.
- Shadcn/ui provides a library of accessible React components that will serve as the UI foundation.

## Backend – Supabase as a comprehensive backend solution:

- Provides a PostgreSQL database.
- Offers SDKs in multiple languages, serving as a Backend-as-a-Service.
- It is an open-source solution that can be self-hosted or run on your own server.
- Includes built-in user authentication.

## AI – Communication with models via the Openrouter.ai service:

- Access to a wide range of models (OpenAI, Anthropic, Google, and many others), enabling us to find solutions that provide high efficiency and low cost.
- Allows setting financial limits on API keys.

## CI/CD and Hosting:

- GitHub Actions for creating CI/CD pipelines.
- DigitalOcean for hosting the application via a Docker image.

## Testing and Quality Assurance:

### Unit Testing

- **Framework**: Vitest
- **Targets**:
  - Utility functions (e.g., `parameter-status.ts`)
  - Zod validation schemas
  - Individual service methods with mocked dependencies
  - Type safety verification with TypeScript
- **Purpose**: Verify individual functions and modules in isolation to ensure correctness at the unit level.

### Integration Testing

- **Framework**: Vitest
- **Targets**:
  - Service layer integration with the Supabase database
  - API endpoints' interaction with their respective services
  - Data flow between components and services
- **Purpose**: Validate the interaction between different parts of the application to ensure components work together correctly.

### E2E and API Testing

- **Framework**: Playwright
- **Purpose**: Simulate real user scenarios from start to finish and validate the full functionality of the API layer independently of the UI.

### Testing Tools Summary

- **Vitest**: Modern, fast unit and integration testing framework optimized for Vite-based projects like Astro.
- **Playwright**: Excellent choice for modern web applications with robust APIs for browser automation, network request interception, and API testing.
