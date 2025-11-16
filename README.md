# ReefMetrics

[![Project Status: MVP Development](https://img.shields.io/badge/status-MVP%20Development-blue.svg)](https://github.com/jaceksobieraj/reef-metrics)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A web application for marine aquarium hobbyists to monitor water parameters, analyze results, and receive AI-driven recommendations.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)
- [API Documentation](#api-documentation)

## Project Description

ReefMetrics is a Minimum Viable Product (MVP) designed to help marine aquarists centralize the monitoring of water parameters. The current process of tracking water chemistry is often fragmented, relying on notebooks or spreadsheets, which makes it difficult to track trends and detect problems.

This application provides a dedicated platform to:
- Manually enter test results for seven key water parameters.
- Compare results against predefined or personalized optimal values.
- Receive AI-generated recommendations when abnormalities are detected.
- Visualize the health of the aquarium ecosystem with color-coded status indicators.

The goal is to simplify aquarium management by providing a centralized tool for data aggregation, historical tracking, and actionable insights.

## Tech Stack

### Frontend
- **Framework**: [Astro 5](https://astro.build/)
- **UI Library**: [React 19](https://react.dev/) for interactive components
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [Shadcn/ui](https://ui.shadcn.com/)

### Backend
- **Service**: [Supabase](https://supabase.com/)
  - **Database**: PostgreSQL
  - **Authentication**: Built-in user management
  - **APIs**: Backend-as-a-Service

### AI
- **Service**: [Openrouter.ai](https://openrouter.ai/) for access to various large language models.

### DevOps
- **CI/CD**: GitHub Actions
- **Hosting**: DigitalOcean (via Docker)

## Getting Started Locally

To set up and run this project locally, follow these steps:

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/jaceksobieraj/reef-metrics.git
    cd reef-metrics
    ```

2.  **Set up Node.js:**
    Ensure you are using the correct Node.js version as specified in the `.nvmrc` file. If you use `nvm`, you can run:
    ```sh
    nvm use
    ```

3.  **Install dependencies:**
    ```sh
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary environment variables for Supabase.
    ```env
    PUBLIC_SUPABASE_URL="your-supabase-url"
    PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
    ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

The following scripts are available in `package.json`:

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Lints and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.

## Project Scope

### Included Features (MVP)

- **User Management**: Secure user registration, login, logout, and password reset.
- **Aquarium Management**: Users can add, edit, and delete one or more aquariums in their profile.
- **Parameter Tracking**: Track 7 key parameters: Salinity (SG), Carbonate Hardness (kH), Calcium (Ca), Magnesium (Mg), Phosphates (PO4), Nitrates (NO3), and Temperature.
- **Dashboard**: A central dashboard displaying the most recent measurements with color-coded status indicators (Green, Orange, Red) to show deviation from optimal values.
- **AI Recommendations**: AI-generated analysis and corrective actions for each parameter.

### Excluded Features (Future Versions)

- Importing measurement data from external files (e.g., CSV).
- Generating charts to show parameter trends over time.
- Social features, such as sharing results with other users.
- Exporting reports and summaries to PDF.
- A dedicated mobile application.

## Project Status

This project is currently in the **MVP development phase**. The core features are being built, and the focus is on delivering a stable and functional product that addresses the primary user problem.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## API Documentation

The ReefMetrics API provides REST endpoints for managing aquariums and their measurements. All endpoints require authentication via Supabase JWT tokens.

### Authentication
All API requests must include a valid JWT token obtained from Supabase authentication. The token is automatically handled by the frontend client.

### Endpoints

#### Aquariums
- `GET /api/aquariums` - List user's aquariums
- `POST /api/aquariums` - Create new aquarium
- `GET /api/aquariums/:id` - Get aquarium details
- `PATCH /api/aquariums/:id` - Update aquarium
- `DELETE /api/aquariums/:id` - Delete aquarium

#### Measurements
- `GET /api/measurements/:aquariumId` - List measurements with filtering and pagination
  - Query params: `start_date`, `end_date`, `parameter_id`, `limit`, `offset`, `sort`, `order`
- `GET /api/measurements/:aquariumId/latest` - Get latest measurement per parameter
- `GET /api/measurements/:aquariumId/by-date/:date` - Get measurements for specific date (YYYY-MM-DD)
- `GET /api/measurements/:aquariumId/calendar` - Get calendar dates with measurement counts
  - Query params: `year`, `month`
- `POST /api/measurements/:aquariumId` - Create single measurement
- `POST /api/measurements/:aquariumId/bulk` - Create multiple measurements
- `GET /api/measurements/:id` - Get single measurement
- `PATCH /api/measurements/:id` - Update measurement
- `DELETE /api/measurements/:id` - Delete measurement

#### Reference Data
- `GET /api/aquarium-types` - List all aquarium types
- `GET /api/aquarium-types/:id` - Get single aquarium type
- `GET /api/parameters` - List all parameters
- `GET /api/parameters/:id` - Get single parameter
- `GET /api/default-optimal-values` - List default optimal values with optional filters
  - Query params: `aquarium_type_id`, `parameter_id`
- `GET /api/aquarium-types/:aquariumTypeId/optimal-values` - Get optimal values for specific aquarium type

### Response Format
All responses follow a consistent structure:
```json
{
  "data": { ... } // Single item or array
}
```

Paginated responses include:
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

### Error Responses
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [...] // Optional validation errors
  }
}
```

Common error codes: `UNAUTHORIZED`, `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`
