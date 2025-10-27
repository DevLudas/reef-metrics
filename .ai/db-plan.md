# PostgreSQL Database Schema for ReefMetrics MVP

This document outlines the database schema, relationships, indexes, and security policies for the ReefMetrics project, based on the planning sessions and product requirements.

## 1. Tables

### `aquarium_types`
Stores the predefined categories of marine aquariums. This table will be pre-populated.

| Column      | Data Type     | Constraints                               | Description                  |
|-------------|---------------|-------------------------------------------|------------------------------|
| `id`        | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`| Unique identifier for the type.|
| `name`      | `TEXT`        | `UNIQUE`, `NOT NULL`                      | Name of the aquarium type (e.g., "LPS", "SPS"). |
| `description`| `TEXT`        |                                           | A brief description of the type. |

### `parameters`
Stores the key water parameters that are tracked in the application. This table will be pre-populated.

| Column | Data Type | Constraints                               | Description                   |
|--------|-----------|-------------------------------------------|-------------------------------|
| `id`   | `UUID`    | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`| Unique identifier for the parameter. |
| `name` | `TEXT`    | `UNIQUE`, `NOT NULL`                      | Name of the parameter (e.g., "Salinity"). |
| `unit` | `TEXT`    | `NOT NULL`                                | Measurement unit (e.g., "SG", "dKH"). |

### `aquariums`
Stores information about the aquariums owned by users.

| Column            | Data Type       | Constraints                               | Description                   |
|-------------------|-----------------|-------------------------------------------|-------------------------------|
| `id`              | `UUID`          | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`| Unique identifier for the aquarium. |
| `user_id`         | `UUID`          | `NOT NULL`, `REFERENCES auth.users(id)`   | Foreign key to the user who owns the aquarium. |
| `aquarium_type_id`| `UUID`          | `NOT NULL`, `REFERENCES aquarium_types(id) ON DELETE RESTRICT` | Foreign key to the aquarium type. |
| `name`            | `TEXT`          | `NOT NULL`                                | User-defined name for the aquarium. |
| `description`     | `VARCHAR(255)`  |                                           | A short description of the aquarium. |
| `created_at`      | `TIMESTAMPTZ`   | `DEFAULT now()`                           | Timestamp of when the aquarium was created. |

### `default_optimal_values`
Stores the default optimal parameter values for each aquarium type. This table will be pre-populated.

| Column            | Data Type       | Constraints                               | Description                   |
|-------------------|-----------------|-------------------------------------------|-------------------------------|
| `id`              | `UUID`          | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`| Unique identifier for the default value record. |
| `aquarium_type_id`| `UUID`          | `NOT NULL`, `REFERENCES aquarium_types(id) ON DELETE CASCADE` | Foreign key to the aquarium type. |
| `parameter_id`    | `UUID`          | `NOT NULL`, `REFERENCES parameters(id) ON DELETE CASCADE` | Foreign key to the parameter. |
| `min_value`       | `NUMERIC(8, 4)` | `NOT NULL`                                | The minimum optimal value for the parameter. |
| `max_value`       | `NUMERIC(8, 4)` | `NOT NULL`                                | The maximum optimal value for the parameter. |
|                   |                 | `UNIQUE (aquarium_type_id, parameter_id)` | Ensures one default value per parameter per type. |

### `measurements`
Stores the measurement data entered by users for their aquariums.

| Column        | Data Type       | Constraints                               | Description                   |
|---------------|-----------------|-------------------------------------------|-------------------------------|
| `id`          | `UUID`          | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`| Unique identifier for the measurement. |
| `aquarium_id` | `UUID`          | `NOT NULL`, `REFERENCES aquariums(id) ON DELETE CASCADE` | Foreign key to the aquarium this measurement belongs to. |
| `parameter_id`| `UUID`          | `NOT NULL`, `REFERENCES parameters(id) ON DELETE CASCADE` | Foreign key to the parameter being measured. |
| `value`       | `NUMERIC(8, 4)` | `NOT NULL`                                | The measured value.           |
| `created_at`  | `TIMESTAMPTZ`   | `DEFAULT now()`                           | Timestamp of when the measurement was recorded. |

## 2. Relationships

### Supabase Auth `users` Table
User management is handled by Supabase Auth. The `users` table resides in the `auth` schema and is not managed by our application migrations. The `aquariums` table references it via a foreign key.

| Column | Data Type | Description |
|---|---|---|
| `id` | `UUID` | Unique identifier for the user, provided by Supabase Auth. |
| `email` | `TEXT` | User's email address. |
| ... | ... | Other columns managed by Supabase Auth. |

-   **Users to Aquariums**: One-to-Many (`auth.users` 1-to-N `aquariums`). A user can have multiple aquariums.
-   **Aquarium Types to Aquariums**: One-to-Many (`aquarium_types` 1-to-N `aquariums`). An aquarium has one type.
-   **Aquariums to Measurements**: One-to-Many (`aquariums` 1-to-N `measurements`). An aquarium can have many measurements.
-   **Parameters to Measurements**: One-to-Many (`parameters` 1-to-N `measurements`). A parameter can be recorded in many measurements.
-   **Aquarium Types and Parameters to Default Optimal Values**: A many-to-many relationship modeled through the `default_optimal_values` table, where each `(aquarium_type, parameter)` pair has one default optimal value.

## 3. Indexes

To optimize query performance, especially for fetching the latest measurements for the dashboard.

```sql
-- Index to efficiently query the latest measurement for a specific parameter in an aquarium.
CREATE INDEX idx_measurements_latest ON measurements (aquarium_id, parameter_id, created_at DESC);
```

## 4. Row-Level Security (RLS) Policies

RLS policies ensure that users can only access and manage data related to their own aquariums.

### Enable RLS on Tables
```sql
-- Enable RLS for aquariums and measurements tables
ALTER TABLE aquariums ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
```

### Policies for `aquariums` Table
```sql
-- Policy to allow users to view their own aquariums.
CREATE POLICY "Allow users to view their own aquariums"
ON aquariums FOR SELECT
USING (auth.uid() = user_id);

-- Policy to allow users to create aquariums for themselves.
CREATE POLICY "Allow users to create their own aquariums"
ON aquariums FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own aquariums.
CREATE POLICY "Allow users to update their own aquariums"
ON aquariums FOR UPDATE
USING (auth.uid() = user_id);

-- Policy to allow users to delete their own aquariums.
CREATE POLICY "Allow users to delete their own aquariums"
ON aquariums FOR DELETE
USING (auth.uid() = user_id);
```

### Policies for `measurements` Table
```sql
-- Policy to allow users to view measurements for their own aquariums.
CREATE POLICY "Allow users to view measurements for their own aquariums"
ON measurements FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM aquariums
    WHERE aquariums.id = measurements.aquarium_id
      AND aquariums.user_id = auth.uid()
  )
);

-- Policy to allow users to insert measurements for their own aquariums.
CREATE POLICY "Allow users to insert measurements for their own aquariums"
ON measurements FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM aquariums
    WHERE aquariums.id = measurements.aquarium_id
      AND aquariums.user_id = auth.uid()
  )
);

-- Policy to allow users to update measurements for their own aquariums.
CREATE POLICY "Allow users to update measurements for their own aquariums"
ON measurements FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM aquariums
    WHERE aquariums.id = measurements.aquarium_id
      AND aquariums.user_id = auth.uid()
  )
);

-- Policy to allow users to delete measurements for their own aquariums.
CREATE POLICY "Allow users to delete measurements for their own aquariums"
ON measurements FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM aquariums
    WHERE aquariums.id = measurements.aquarium_id
      AND aquariums.user_id = auth.uid()
  )
);
```

