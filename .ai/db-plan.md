# PostgreSQL Database Schema for ReefMetrics MVP

This document outlines the database schema, relationships, indexes, and security policies for the ReefMetrics project, based on the planning sessions and product requirements.

## 1. Tables

### `aquarium_types`

Stores the predefined categories of marine aquariums. This table will be pre-populated.

| Column        | Data Type | Constraints                                | Description                                                           |
| ------------- | --------- | ------------------------------------------ | --------------------------------------------------------------------- |
| `id`          | `UUID`    | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for the type.                                       |
| `name`        | `TEXT`    | `UNIQUE`, `NOT NULL`                       | Name of the aquarium type (e.g., "LPS", "SPS", "Fish Only", "Mixed"). |
| `description` | `TEXT`    |                                            | A brief description of the type.                                      |

### `parameters`

Stores the key water parameters that are tracked in the application. This table will be pre-populated with 7 parameters: Salinity (SG), Carbonate Hardness (kH), Calcium (Ca), Magnesium (Mg), Phosphates (PO4), Nitrates (NO3), and Temperature.

| Column        | Data Type | Constraints                                | Description                                        |
| ------------- | --------- | ------------------------------------------ | -------------------------------------------------- |
| `id`          | `UUID`    | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for the parameter.               |
| `name`        | `TEXT`    | `UNIQUE`, `NOT NULL`                       | Short name of the parameter (e.g., "SG", "kH").    |
| `full_name`   | `TEXT`    | `NOT NULL`                                 | Full name of the parameter (e.g., "Salinity").     |
| `unit`        | `TEXT`    | `NOT NULL`                                 | Measurement unit (e.g., "SG", "dKH", "ppm", "°C"). |
| `description` | `TEXT`    |                                            | Description of what the parameter measures.        |

### `aquariums`

Stores information about the aquariums owned by users.

| Column             | Data Type       | Constraints                                                    | Description                                             |
| ------------------ | --------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| `id`               | `UUID`          | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                     | Unique identifier for the aquarium.                     |
| `user_id`          | `UUID`          | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`      | Foreign key to the user who owns the aquarium.          |
| `aquarium_type_id` | `UUID`          | `NOT NULL`, `REFERENCES aquarium_types(id) ON DELETE RESTRICT` | Foreign key to the aquarium type.                       |
| `name`             | `TEXT`          | `NOT NULL`                                                     | User-defined name for the aquarium.                     |
| `description`      | `TEXT`          |                                                                | A description of the aquarium.                          |
| `volume`           | `NUMERIC(8, 2)` |                                                                | Volume of the aquarium (optional, for future features). |
| `created_at`       | `TIMESTAMPTZ`   | `NOT NULL`, `DEFAULT now()`                                    | Timestamp of when the aquarium was created.             |
|                    |                 | `UNIQUE (user_id, name)`                                       | Ensures unique aquarium names per user.                 |

### `default_optimal_values`

Stores the default optimal parameter values for each aquarium type. This table will be pre-populated and is read-only for MVP.

| Column             | Data Type        | Constraints                                                   | Description                                       |
| ------------------ | ---------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| `id`               | `UUID`           | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                    | Unique identifier for the default value record.   |
| `aquarium_type_id` | `UUID`           | `NOT NULL`, `REFERENCES aquarium_types(id) ON DELETE CASCADE` | Foreign key to the aquarium type.                 |
| `parameter_id`     | `UUID`           | `NOT NULL`, `REFERENCES parameters(id) ON DELETE CASCADE`     | Foreign key to the parameter.                     |
| `min_value`        | `NUMERIC(10, 4)` | `NOT NULL`                                                    | The minimum optimal value for the parameter.      |
| `max_value`        | `NUMERIC(10, 4)` | `NOT NULL`                                                    | The maximum optimal value for the parameter.      |
|                    |                  | `UNIQUE (aquarium_type_id, parameter_id)`                     | Ensures one default value per parameter per type. |
|                    |                  | `CHECK (max_value > min_value)`                               | Ensures logical consistency of range.             |

### `measurements`

Stores the measurement data entered by users for their aquariums. Uses a "long format" structure for flexibility.

| Column             | Data Type        | Constraints                                                | Description                                              |
| ------------------ | ---------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| `id`               | `UUID`           | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                 | Unique identifier for the measurement.                   |
| `aquarium_id`      | `UUID`           | `NOT NULL`, `REFERENCES aquariums(id) ON DELETE CASCADE`   | Foreign key to the aquarium this measurement belongs to. |
| `parameter_id`     | `UUID`           | `NOT NULL`, `REFERENCES parameters(id) ON DELETE RESTRICT` | Foreign key to the parameter being measured.             |
| `value`            | `NUMERIC(10, 4)` | `NOT NULL`                                                 | The measured value.                                      |
| `measurement_time` | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT now()`                                | Timestamp of when the measurement was recorded.          |
| `notes`            | `TEXT`           |                                                            | Optional notes about the measurement.                    |
| `created_at`       | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT now()`                                | Timestamp of when the record was created in the system.  |
|                    |                  | `CHECK (value >= 0)`                                       | Basic validation to ensure non-negative values.          |

## 2. Relationships

### Supabase Auth `users` Table

User management is handled by Supabase Auth. The `users` table resides in the `auth` schema and is not managed by our application migrations. The `aquariums` table references it via a foreign key.

| Column  | Data Type | Description                                                |
| ------- | --------- | ---------------------------------------------------------- |
| `id`    | `UUID`    | Unique identifier for the user, provided by Supabase Auth. |
| `email` | `TEXT`    | User's email address.                                      |
| ...     | ...       | Other columns managed by Supabase Auth.                    |

### Relationship Summary

- **Users to Aquariums**: One-to-Many (`auth.users` 1-to-N `aquariums`)
  - A user can have multiple aquariums.
  - CASCADE delete: When a user is deleted, all their aquariums are deleted.

- **Aquarium Types to Aquariums**: One-to-Many (`aquarium_types` 1-to-N `aquariums`)
  - An aquarium has one type.
  - RESTRICT delete: Cannot delete an aquarium type if it's in use.

- **Aquariums to Measurements**: One-to-Many (`aquariums` 1-to-N `measurements`)
  - An aquarium can have many measurements.
  - CASCADE delete: When an aquarium is deleted, all its measurements are deleted.

- **Parameters to Measurements**: One-to-Many (`parameters` 1-to-N `measurements`)
  - A parameter can be recorded in many measurements.
  - RESTRICT delete: Cannot delete a parameter if it has measurements.

- **Aquarium Types and Parameters to Default Optimal Values**: Many-to-Many (via `default_optimal_values`)
  - Each `(aquarium_type, parameter)` pair has one default optimal value.
  - CASCADE delete: When an aquarium type or parameter is deleted, its default values are deleted.

## 3. Indexes

To optimize query performance, especially for fetching the latest measurements for the dashboard and historical data browsing.

```sql
-- Index to efficiently query measurements for a specific aquarium, ordered by time (most recent first)
CREATE INDEX idx_measurements_aquarium_time ON measurements (aquarium_id, measurement_time DESC);

-- Index to efficiently query measurements for a specific aquarium and parameter
CREATE INDEX idx_measurements_aquarium_parameter ON measurements (aquarium_id, parameter_id, measurement_time DESC);

-- Index to efficiently query aquariums by user
CREATE INDEX idx_aquariums_user ON aquariums (user_id);

-- Index to efficiently lookup default optimal values
CREATE INDEX idx_default_optimal_values_lookup ON default_optimal_values (aquarium_type_id, parameter_id);
```

## 4. Row-Level Security (RLS) Policies

RLS policies ensure that users can only access and manage data related to their own aquariums. Anonymous users have no access to user data.

### Enable RLS on Tables

```sql
-- Enable RLS for user-specific tables
ALTER TABLE aquariums ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- Reference tables (aquarium_types, parameters, default_optimal_values) are read-only for all authenticated users
-- and do not require RLS as they contain no user-specific data
```

### Policies for `aquariums` Table

```sql
-- Policy to allow users to view their own aquariums
CREATE POLICY "Users can view their own aquariums"
ON aquariums FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy to allow users to create aquariums for themselves
CREATE POLICY "Users can create their own aquariums"
ON aquariums FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own aquariums
CREATE POLICY "Users can update their own aquariums"
ON aquariums FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own aquariums
CREATE POLICY "Users can delete their own aquariums"
ON aquariums FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Deny all access to anonymous users
CREATE POLICY "Anonymous users cannot access aquariums"
ON aquariums
TO anon
USING (false);
```

### Policies for `measurements` Table

```sql
-- Policy to allow users to view measurements for their own aquariums
CREATE POLICY "Users can view measurements for their own aquariums"
ON measurements FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM aquariums
    WHERE aquariums.id = measurements.aquarium_id
      AND aquariums.user_id = auth.uid()
  )
);

-- Policy to allow users to insert measurements for their own aquariums
CREATE POLICY "Users can insert measurements for their own aquariums"
ON measurements FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM aquariums
    WHERE aquariums.id = measurements.aquarium_id
      AND aquariums.user_id = auth.uid()
  )
);

-- Policy to allow users to update measurements for their own aquariums
CREATE POLICY "Users can update measurements for their own aquariums"
ON measurements FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM aquariums
    WHERE aquariums.id = measurements.aquarium_id
      AND aquariums.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM aquariums
    WHERE aquariums.id = measurements.aquarium_id
      AND aquariums.user_id = auth.uid()
  )
);

-- Policy to allow users to delete measurements for their own aquariums
CREATE POLICY "Users can delete measurements for their own aquariums"
ON measurements FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM aquariums
    WHERE aquariums.id = measurements.aquarium_id
      AND aquariums.user_id = auth.uid()
  )
);

-- Deny all access to anonymous users
CREATE POLICY "Anonymous users cannot access measurements"
ON measurements
TO anon
USING (false);
```

### Policies for Reference Tables

```sql
-- Allow all authenticated users to read aquarium types
CREATE POLICY "Authenticated users can read aquarium types"
ON aquarium_types FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to read parameters
CREATE POLICY "Authenticated users can read parameters"
ON parameters FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to read default optimal values
CREATE POLICY "Authenticated users can read default optimal values"
ON default_optimal_values FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on reference tables
ALTER TABLE aquarium_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_optimal_values ENABLE ROW LEVEL SECURITY;
```

## 5. Design Decisions and Notes

### Data Type Choices

- **UUID**: Used for all primary keys and foreign keys for better scalability and security (non-sequential IDs).
- **NUMERIC(10, 4)**: Used for measurement values and optimal ranges to ensure precision and avoid floating-point arithmetic issues. Supports values up to 999999.9999.
- **TIMESTAMPTZ**: Used for all timestamps to ensure timezone awareness and consistency across different user locations.
- **TEXT**: Used for strings without a specific length limit. More flexible than VARCHAR and equally performant in PostgreSQL.

### Normalization

The schema is normalized to 3NF:

- Eliminates redundant data storage
- Ensures data integrity through foreign key constraints
- Facilitates future extensions (e.g., adding new parameters or aquarium types)

### Long Format for Measurements

The "long format" (one row per parameter per measurement) was chosen over "wide format" (one row with all parameters as columns) for several reasons:

- **Flexibility**: Easy to add new parameters without schema changes
- **Query efficiency**: Better for time-series analysis and parameter-specific queries
- **Normalization**: Avoids NULL values when not all parameters are measured
- **Indexing**: More efficient indexing strategies for specific use cases

### Security Architecture

- **Multi-tenant isolation**: Strict RLS policies ensure complete data isolation between users
- **Authenticated-only access**: User data is only accessible to authenticated users
- **Defense in depth**: Combination of RLS policies, foreign key constraints, and CHECK constraints
- **Principle of least privilege**: Anonymous users have no access to user-specific data

### Performance Considerations

- **Strategic indexing**: Composite indexes optimized for the most common query patterns (dashboard latest values, historical browsing)
- **Cascade deletes**: Automated cleanup reduces orphaned records and simplifies application logic
- **Efficient RLS**: Policies use indexed columns (user_id) for fast evaluation

### Future-Proofing

While designed for MVP, the schema supports future enhancements:

- **Custom optimal values**: Could be added via a `custom_optimal_values` table without changing existing structure
- **Additional metadata**: The `volume` field in aquariums and `notes` field in measurements support future features
- **Audit trail**: `created_at` timestamps enable basic audit functionality
- **Parameter extensibility**: New parameters can be added to the `parameters` table without schema changes

### Pre-populated Data

The following tables will be pre-populated during initial migration:

1. **aquarium_types**: LPS, SPS, Fish Only, Mixed
2. **parameters**: SG, kH, Ca, Mg, PO4, NO3, Temperature (with full names, units, descriptions)
3. **default_optimal_values**: Optimal ranges for each parameter for each aquarium type

### AI Recommendations

As per the session notes, AI-generated recommendations will be created dynamically on-demand and will not be persisted in the database. This decision:

- Simplifies the MVP schema
- Ensures users always get the latest AI insights
- Reduces database storage requirements
- Can be revisited in future iterations if recommendation history becomes a priority

### Excluded from MVP

The following features are intentionally excluded from this schema:

- Custom user-defined optimal parameter ranges (pre-populated defaults only)
- CSV import functionality
- AI recommendation history
- Social features or data sharing
- Advanced analytics tables or materialized views
- Parameter value trend calculations (computed on-demand)
