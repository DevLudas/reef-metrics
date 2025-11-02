-- =====================================================================
-- Migration: recreate_schema_with_improvements
-- Description: Recreates the database schema with improvements from db-plan.md
--              - Adds full_name and description to parameters table
--              - Adds description to aquarium_types table
--              - Adds volume field to aquariums table
--              - Adds UNIQUE constraint for aquarium names per user
--              - Adds measurement_time and notes fields to measurements table
--              - Updates NUMERIC precision to (10, 4) for measurements
--              - Adds proper CHECK constraints
--              - Improves indexes for better query performance
--              - Implements comprehensive RLS policies
-- Created at: 2025-11-02 12:00:00 UTC
-- Affected tables: All tables (drop and recreate)
-- =====================================================================

-- =====================================================================
-- STEP 1: Drop existing tables
-- =====================================================================
-- Note: Dropping tables in reverse dependency order to avoid foreign key conflicts
-- This is a destructive operation and will remove all existing data

drop table if exists public.measurements cascade;
drop table if exists public.default_optimal_values cascade;
drop table if exists public.aquariums cascade;
drop table if exists public.parameters cascade;
drop table if exists public.aquarium_types cascade;

-- =====================================================================
-- STEP 1: Create aquarium_types table
-- =====================================================================
-- This table stores the predefined categories of marine aquariums.
-- It will be pre-populated with initial data.
-- Examples: "LPS", "SPS", "Fish Only", "Mixed"

create table public.aquarium_types (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,

    -- Metadata
    created_at timestamptz not null default now()
);

-- Add table and column comments for documentation
comment on table public.aquarium_types is 'Stores the predefined categories of marine aquariums (LPS, SPS, Fish Only, Mixed).';
comment on column public.aquarium_types.id is 'Unique identifier for the aquarium type.';
comment on column public.aquarium_types.name is 'The unique name of the aquarium type (e.g., "LPS", "SPS").';
comment on column public.aquarium_types.description is 'A brief description of the aquarium type and its characteristics.';

-- Enable row-level security
alter table public.aquarium_types enable row level security;

-- =====================================================================
-- STEP 3: Create parameters table
-- =====================================================================
-- This table stores the key water parameters that are tracked in the application.
-- It will be pre-populated with 7 parameters: Salinity (SG), Carbonate Hardness (kH),
-- Calcium (Ca), Magnesium (Mg), Phosphates (PO4), Nitrates (NO3), and Temperature.

create table public.parameters (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    full_name text not null,
    unit text not null,
    description text,

    -- Metadata
    created_at timestamptz not null default now()
);

-- Add table and column comments for documentation
comment on table public.parameters is 'Stores the key water parameters tracked in the application (SG, kH, Ca, Mg, PO4, NO3, Temperature).';
comment on column public.parameters.id is 'Unique identifier for the parameter.';
comment on column public.parameters.name is 'Short name of the parameter (e.g., "SG", "kH").';
comment on column public.parameters.full_name is 'Full name of the parameter (e.g., "Salinity", "Carbonate Hardness").';
comment on column public.parameters.unit is 'Measurement unit (e.g., "SG", "dKH", "ppm", "°C").';
comment on column public.parameters.description is 'Description of what the parameter measures and its importance.';

-- Enable row-level security
alter table public.parameters enable row level security;

-- =====================================================================
-- STEP 4: Create aquariums table
-- =====================================================================
-- This table stores information about the aquariums owned by users.
-- Each user can have multiple aquariums, and each aquarium belongs to one user.

create table public.aquariums (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    aquarium_type_id uuid not null references public.aquarium_types(id) on delete restrict,
    name text not null,
    description text,
    volume numeric(8, 2),

    -- Metadata
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Constraints
    unique (user_id, name)
);

-- Add table and column comments for documentation
comment on table public.aquariums is 'Stores information about the aquariums owned by users.';
comment on column public.aquariums.id is 'Unique identifier for the aquarium.';
comment on column public.aquariums.user_id is 'Foreign key to the user who owns the aquarium (auth.users).';
comment on column public.aquariums.aquarium_type_id is 'Foreign key to the aquarium type.';
comment on column public.aquariums.name is 'User-defined name for the aquarium (must be unique per user).';
comment on column public.aquariums.description is 'Optional description of the aquarium.';
comment on column public.aquariums.volume is 'Volume of the aquarium in liters (optional, for future features).';

-- Enable row-level security
alter table public.aquariums enable row level security;

-- =====================================================================
-- STEP 5: Create default_optimal_values table
-- =====================================================================
-- This table stores the default optimal parameter values for each aquarium type.
-- It will be pre-populated and is read-only for MVP.
-- Each (aquarium_type, parameter) pair has one default optimal value range.

create table public.default_optimal_values (
    id uuid primary key default gen_random_uuid(),
    aquarium_type_id uuid not null references public.aquarium_types(id) on delete cascade,
    parameter_id uuid not null references public.parameters(id) on delete cascade,
    min_value numeric(10, 4) not null,
    max_value numeric(10, 4) not null,

    -- Metadata
    created_at timestamptz not null default now(),

    -- Constraints
    unique (aquarium_type_id, parameter_id),
    check (max_value > min_value)
);

-- Add table and column comments for documentation
comment on table public.default_optimal_values is 'Stores the default optimal parameter value ranges for each aquarium type (pre-populated, read-only for MVP).';
comment on column public.default_optimal_values.id is 'Unique identifier for the default value record.';
comment on column public.default_optimal_values.aquarium_type_id is 'Foreign key to the aquarium type.';
comment on column public.default_optimal_values.parameter_id is 'Foreign key to the parameter.';
comment on column public.default_optimal_values.min_value is 'The minimum optimal value for the parameter.';
comment on column public.default_optimal_values.max_value is 'The maximum optimal value for the parameter.';

-- Enable row-level security
alter table public.default_optimal_values enable row level security;

-- =====================================================================
-- STEP 6: Create measurements table
-- =====================================================================
-- This table stores the measurement data entered by users for their aquariums.
-- Uses a "long format" structure (one row per parameter per measurement) for flexibility.
-- This allows easy addition of new parameters and efficient time-series analysis.

create table public.measurements (
    id uuid primary key default gen_random_uuid(),
    aquarium_id uuid not null references public.aquariums(id) on delete cascade,
    parameter_id uuid not null references public.parameters(id) on delete restrict,
    value numeric(10, 4) not null,
    measurement_time timestamptz not null default now(),
    notes text,

    -- Metadata
    created_at timestamptz not null default now(),

    -- Constraints
    check (value >= 0)
);

-- Add table and column comments for documentation
comment on table public.measurements is 'Stores the measurement data entered by users for their aquariums (long format: one row per parameter per measurement).';
comment on column public.measurements.id is 'Unique identifier for the measurement.';
comment on column public.measurements.aquarium_id is 'Foreign key to the aquarium this measurement belongs to.';
comment on column public.measurements.parameter_id is 'Foreign key to the parameter being measured.';
comment on column public.measurements.value is 'The measured value (must be non-negative).';
comment on column public.measurements.measurement_time is 'Timestamp of when the measurement was taken (user-specified or defaults to now).';
comment on column public.measurements.notes is 'Optional notes about the measurement.';
comment on column public.measurements.created_at is 'Timestamp of when the record was created in the system.';

-- Enable row-level security
alter table public.measurements enable row level security;

-- =====================================================================
-- STEP 7: Create indexes for query performance
-- =====================================================================
-- These indexes are strategically designed to optimize the most common query patterns:
-- - Dashboard: fetching the latest measurements for an aquarium
-- - Historical data: browsing measurements over time for a specific parameter
-- - User aquariums: listing all aquariums owned by a user
-- - Optimal values lookup: retrieving default values for a given aquarium type and parameter

-- Index for efficiently querying measurements for a specific aquarium, ordered by time (most recent first)
-- Supports: Dashboard latest values, historical browsing
create index idx_measurements_aquarium_time on public.measurements (aquarium_id, measurement_time desc);

-- Index for efficiently querying measurements for a specific aquarium and parameter
-- Supports: Parameter-specific historical charts and analysis
create index idx_measurements_aquarium_parameter on public.measurements (aquarium_id, parameter_id, measurement_time desc);

-- Index for efficiently querying aquariums by user
-- Supports: Listing all aquariums owned by a user
create index idx_aquariums_user on public.aquariums (user_id);

-- Index for efficiently looking up default optimal values
-- Supports: Retrieving optimal ranges for validation and comparison
create index idx_default_optimal_values_lookup on public.default_optimal_values (aquarium_type_id, parameter_id);

-- =====================================================================
-- STEP 8: Create RLS policies for aquarium_types table
-- =====================================================================
-- This is a reference table containing predefined aquarium types.
-- All authenticated users can read this data.
-- Anonymous users can also read this data (for public-facing features).
-- Write operations are restricted (data managed via migrations only).

-- Policy: Allow anonymous users to read aquarium types
-- Rationale: Public reference data needed for registration/onboarding flows
create policy "Anonymous users can read aquarium types"
on public.aquarium_types for select
to anon
using (true);

-- Policy: Allow authenticated users to read aquarium types
-- Rationale: Reference data needed for creating/editing aquariums
create policy "Authenticated users can read aquarium types"
on public.aquarium_types for select
to authenticated
using (true);

-- =====================================================================
-- STEP 9: Create RLS policies for parameters table
-- =====================================================================
-- This is a reference table containing predefined water parameters.
-- All authenticated users can read this data.
-- Anonymous users can also read this data (for public-facing features).
-- Write operations are restricted (data managed via migrations only).

-- Policy: Allow anonymous users to read parameters
-- Rationale: Public reference data for educational content
create policy "Anonymous users can read parameters"
on public.parameters for select
to anon
using (true);

-- Policy: Allow authenticated users to read parameters
-- Rationale: Reference data needed for creating measurements
create policy "Authenticated users can read parameters"
on public.parameters for select
to authenticated
using (true);

-- =====================================================================
-- STEP 10: Create RLS policies for aquariums table
-- =====================================================================
-- Users can only access their own aquariums.
-- Anonymous users have no access.
-- This ensures multi-tenant data isolation.

-- Policy: Allow authenticated users to view their own aquariums
-- Rationale: Users should see only their own aquariums for privacy and data isolation
create policy "Users can view their own aquariums"
on public.aquariums for select
to authenticated
using (auth.uid() = user_id);

-- Policy: Allow authenticated users to create their own aquariums
-- Rationale: Users should be able to create new aquariums for themselves
-- The WITH CHECK ensures the user_id matches the authenticated user
create policy "Users can create their own aquariums"
on public.aquariums for insert
to authenticated
with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own aquariums
-- Rationale: Users should be able to modify their own aquarium details
-- Both USING and WITH CHECK ensure ownership before and after the update
create policy "Users can update their own aquariums"
on public.aquariums for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to delete their own aquariums
-- Rationale: Users should be able to remove their own aquariums
-- Cascade delete will automatically remove associated measurements
create policy "Users can delete their own aquariums"
on public.aquariums for delete
to authenticated
using (auth.uid() = user_id);

-- Policy: Deny all access to anonymous users
-- Rationale: Aquariums are private user data that should not be accessible without authentication
create policy "Anonymous users cannot access aquariums"
on public.aquariums
to anon
using (false);

-- =====================================================================
-- STEP 11: Create RLS policies for default_optimal_values table
-- =====================================================================
-- This is a reference table containing default optimal parameter ranges.
-- All authenticated users can read this data.
-- Anonymous users can also read this data (for educational purposes).
-- Write operations are restricted (data managed via migrations only).

-- Policy: Allow anonymous users to read default optimal values
-- Rationale: Public reference data for educational content about reef keeping
create policy "Anonymous users can read default optimal values"
on public.default_optimal_values for select
to anon
using (true);

-- Policy: Allow authenticated users to read default optimal values
-- Rationale: Reference data needed for comparing measurements and generating recommendations
create policy "Authenticated users can read default optimal values"
on public.default_optimal_values for select
to authenticated
using (true);

-- =====================================================================
-- STEP 12: Create RLS policies for measurements table
-- =====================================================================
-- Users can only access measurements for their own aquariums.
-- Anonymous users have no access.
-- Policies use EXISTS subquery to verify aquarium ownership.

-- Policy: Allow authenticated users to view measurements for their own aquariums
-- Rationale: Users should only see measurements for aquariums they own
-- The EXISTS clause checks if the aquarium belongs to the authenticated user
create policy "Users can view measurements for their own aquariums"
on public.measurements for select
to authenticated
using (
  exists (
    select 1
    from public.aquariums
    where aquariums.id = measurements.aquarium_id
      and aquariums.user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to insert measurements for their own aquariums
-- Rationale: Users should be able to add new measurements to their own aquariums
-- The WITH CHECK clause verifies aquarium ownership before allowing the insert
create policy "Users can insert measurements for their own aquariums"
on public.measurements for insert
to authenticated
with check (
  exists (
    select 1
    from public.aquariums
    where aquariums.id = measurements.aquarium_id
      and aquariums.user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to update measurements for their own aquariums
-- Rationale: Users should be able to correct or update their own measurements
-- Both USING and WITH CHECK ensure ownership before and after the update
create policy "Users can update measurements for their own aquariums"
on public.measurements for update
to authenticated
using (
  exists (
    select 1
    from public.aquariums
    where aquariums.id = measurements.aquarium_id
      and aquariums.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.aquariums
    where aquariums.id = measurements.aquarium_id
      and aquariums.user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to delete measurements for their own aquariums
-- Rationale: Users should be able to remove incorrect or unwanted measurements
-- The USING clause verifies aquarium ownership before allowing the delete
create policy "Users can delete measurements for their own aquariums"
on public.measurements for delete
to authenticated
using (
  exists (
    select 1
    from public.aquariums
    where aquariums.id = measurements.aquarium_id
      and aquariums.user_id = auth.uid()
  )
);

-- Policy: Deny all access to anonymous users
-- Rationale: Measurements are private user data that should not be accessible without authentication
create policy "Anonymous users cannot access measurements"
on public.measurements
to anon
using (false);

-- =====================================================================
-- STEP 13: Seed aquarium_types table
-- =====================================================================
-- Pre-populate with the four main types of reef aquariums

insert into public.aquarium_types (name, description) values
  ('LPS', 'Large Polyp Stony corals - Hardy corals with large, fleshy polyps. Suitable for intermediate aquarists.'),
  ('SPS', 'Small Polyp Stony corals - Requires stable parameters and strong lighting. For advanced aquarists.'),
  ('Fish Only', 'Fish-only aquarium without corals. More forgiving water parameters.'),
  ('Mixed', 'Mixed reef with various coral types. Requires balanced parameters to support diverse life.');

-- =====================================================================
-- STEP 14: Seed parameters table
-- =====================================================================
-- Pre-populate with the 7 key water parameters tracked in the MVP

insert into public.parameters (name, full_name, unit, description) values
  ('SG', 'Salinity', 'SG', 'Specific gravity measures salt concentration. Ideal range: 1.024-1.026 for reef tanks.'),
  ('kH', 'Carbonate Hardness', 'dKH', 'Alkalinity buffer that stabilizes pH and supports coral skeleton growth.'),
  ('Ca', 'Calcium', 'ppm', 'Essential element for coral skeleton and coralline algae growth.'),
  ('Mg', 'Magnesium', 'ppm', 'Helps maintain calcium and alkalinity levels, prevents precipitation.'),
  ('PO4', 'Phosphates', 'ppm', 'Nutrient that should be kept low to prevent algae growth.'),
  ('NO3', 'Nitrates', 'ppm', 'Nitrogen compound from biological filtration. Low levels preferred in reef tanks.'),
  ('Temp', 'Temperature', '°C', 'Water temperature. Tropical reef tanks typically maintained at 24-26°C.');

-- =====================================================================
-- STEP 15: Seed default_optimal_values table
-- =====================================================================
-- Pre-populate with optimal parameter ranges for each aquarium type
-- Note: These are general guidelines and can be refined based on expert input

-- Get UUIDs for aquarium types (we'll use them in subsequent inserts)
do $$
declare
  lps_id uuid;
  sps_id uuid;
  fish_only_id uuid;
  mixed_id uuid;
  sg_id uuid;
  kh_id uuid;
  ca_id uuid;
  mg_id uuid;
  po4_id uuid;
  no3_id uuid;
  temp_id uuid;
begin
  -- Get aquarium type IDs
  select id into lps_id from public.aquarium_types where name = 'LPS';
  select id into sps_id from public.aquarium_types where name = 'SPS';
  select id into fish_only_id from public.aquarium_types where name = 'Fish Only';
  select id into mixed_id from public.aquarium_types where name = 'Mixed';

  -- Get parameter IDs
  select id into sg_id from public.parameters where name = 'SG';
  select id into kh_id from public.parameters where name = 'kH';
  select id into ca_id from public.parameters where name = 'Ca';
  select id into mg_id from public.parameters where name = 'Mg';
  select id into po4_id from public.parameters where name = 'PO4';
  select id into no3_id from public.parameters where name = 'NO3';
  select id into temp_id from public.parameters where name = 'Temp';

  -- LPS optimal values
  insert into public.default_optimal_values (aquarium_type_id, parameter_id, min_value, max_value) values
    (lps_id, sg_id, 1.024, 1.026),
    (lps_id, kh_id, 8.0, 11.0),
    (lps_id, ca_id, 400.0, 450.0),
    (lps_id, mg_id, 1250.0, 1350.0),
    (lps_id, po4_id, 0.0, 0.1),
    (lps_id, no3_id, 5.0, 15.0),
    (lps_id, temp_id, 24.0, 26.0);

  -- SPS optimal values (more stringent requirements)
  insert into public.default_optimal_values (aquarium_type_id, parameter_id, min_value, max_value) values
    (sps_id, sg_id, 1.025, 1.026),
    (sps_id, kh_id, 7.0, 9.0),
    (sps_id, ca_id, 420.0, 450.0),
    (sps_id, mg_id, 1300.0, 1400.0),
    (sps_id, po4_id, 0.0, 0.05),
    (sps_id, no3_id, 1.0, 5.0),
    (sps_id, temp_id, 24.0, 26.0);

  -- Fish Only optimal values (more relaxed)
  insert into public.default_optimal_values (aquarium_type_id, parameter_id, min_value, max_value) values
    (fish_only_id, sg_id, 1.020, 1.026),
    (fish_only_id, kh_id, 7.0, 12.0),
    (fish_only_id, ca_id, 350.0, 450.0),
    (fish_only_id, mg_id, 1200.0, 1400.0),
    (fish_only_id, po4_id, 0.0, 0.5),
    (fish_only_id, no3_id, 0.0, 40.0),
    (fish_only_id, temp_id, 24.0, 27.0);

  -- Mixed optimal values (balanced requirements)
  insert into public.default_optimal_values (aquarium_type_id, parameter_id, min_value, max_value) values
    (mixed_id, sg_id, 1.024, 1.026),
    (mixed_id, kh_id, 7.5, 10.0),
    (mixed_id, ca_id, 400.0, 450.0),
    (mixed_id, mg_id, 1250.0, 1400.0),
    (mixed_id, po4_id, 0.0, 0.1),
    (mixed_id, no3_id, 2.0, 10.0),
    (mixed_id, temp_id, 24.0, 26.0);
end $$;

-- =====================================================================
-- Migration completed successfully
-- =====================================================================
-- All tables have been recreated with the improved schema
-- RLS policies are in place to ensure data security and multi-tenant isolation
-- Reference tables have been seeded with initial data
-- Indexes are in place to optimize common query patterns
-- =====================================================================

