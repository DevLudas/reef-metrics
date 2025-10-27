-- Migration: initial_schema
-- Description: Sets up the initial database schema for the ReefMetrics application.
-- Created at: 2025-10-27 10:00:00 UTC

--
-- Create table for aquarium_types
--
-- This table stores the predefined categories of marine aquariums (e.g., "LPS", "SPS").
-- It will be pre-populated with initial data.
create table public.aquarium_types (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text
);

-- Add comments to the aquarium_types table and columns
comment on table public.aquarium_types is 'Stores the predefined categories of marine aquariums.';
comment on column public.aquarium_types.name is 'The unique name of the aquarium type (e.g., "LPS", "SPS").';

-- Enable row-level security for the aquarium_types table
alter table public.aquarium_types enable row level security;

--
-- RLS Policies for aquarium_types
--
-- Allow public read access to everyone, as this is considered public information.
create policy "Allow public read access to aquarium types"
on public.aquarium_types for select
to anon, authenticated
using (true);

-- Disallow all write operations for all users via the API.
create policy "Disallow all write access to aquarium types"
on public.aquarium_types for all
to anon, authenticated
using (false);

--
-- Create table for parameters
--
-- This table stores the key water parameters that are tracked (e.g., "Salinity", "kH").
-- It will be pre-populated with initial data.
create table public.parameters (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    unit text not null
);

-- Add comments to the parameters table
comment on table public.parameters is 'Stores the key water parameters that are tracked in the application.';
comment on column public.parameters.name is 'The unique name of the parameter (e.g., "Salinity").';
comment on column public.parameters.unit is 'The measurement unit for the parameter (e.g., "SG", "dKH").';

-- Enable row-level security for the parameters table
alter table public.parameters enable row level security;

--
-- RLS Policies for parameters
--
-- Allow public read access to everyone.
create policy "Allow public read access to parameters"
on public.parameters for select
to anon, authenticated
using (true);

-- Disallow all write operations for all users via the API.
create policy "Disallow all write access to parameters"
on public.parameters for all
to anon, authenticated
using (false);

--
-- Create table for aquariums
--
-- This table stores information about the aquariums owned by users.
create table public.aquariums (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    aquarium_type_id uuid not null references public.aquarium_types(id) on delete restrict,
    name text not null,
    description varchar(255),
    created_at timestamptz default now()
);

-- Add comments to the aquariums table
comment on table public.aquariums is 'Stores information about the aquariums owned by users.';
comment on column public.aquariums.user_id is 'Foreign key to the user who owns the aquarium.';

-- Enable row-level security for the aquariums table
alter table public.aquariums enable row level security;

--
-- RLS Policies for aquariums
--
-- Authenticated users can select their own aquariums.
create policy "Allow authenticated users to select their own aquariums"
on public.aquariums for select
to authenticated
using (auth.uid() = user_id);

-- Authenticated users can insert aquariums for themselves.
create policy "Allow authenticated users to insert their own aquariums"
on public.aquariums for insert
to authenticated
with check (auth.uid() = user_id);

-- Authenticated users can update their own aquariums.
create policy "Allow authenticated users to update their own aquariums"
on public.aquariums for update
to authenticated
using (auth.uid() = user_id);

-- Authenticated users can delete their own aquariums.
create policy "Allow authenticated users to delete their own aquariums"
on public.aquariums for delete
to authenticated
using (auth.uid() = user_id);

--
-- Create table for default_optimal_values
--
-- This table stores the default optimal parameter value ranges for each aquarium type.
create table public.default_optimal_values (
    id uuid primary key default gen_random_uuid(),
    aquarium_type_id uuid not null references public.aquarium_types(id) on delete cascade,
    parameter_id uuid not null references public.parameters(id) on delete cascade,
    min_value numeric(8, 4) not null,
    max_value numeric(8, 4) not null,
    unique (aquarium_type_id, parameter_id)
);

-- Add comments to the default_optimal_values table
comment on table public.default_optimal_values is 'Stores the default optimal parameter value ranges for each aquarium type.';

-- Enable row-level security for the default_optimal_values table
alter table public.default_optimal_values enable row level security;

--
-- RLS Policies for default_optimal_values
--
-- Allow public read access to everyone.
create policy "Allow public read access to default optimal values"
on public.default_optimal_values for select
to anon, authenticated
using (true);

-- Disallow all write operations for all users via the API.
create policy "Disallow all write access to default optimal values"
on public.default_optimal_values for all
to anon, authenticated
using (false);

--
-- Create table for measurements
--
-- This table stores the measurement data entered by users for their aquariums.
create table public.measurements (
    id uuid primary key default gen_random_uuid(),
    aquarium_id uuid not null references public.aquariums(id) on delete cascade,
    parameter_id uuid not null references public.parameters(id) on delete cascade,
    value numeric(8, 4) not null,
    created_at timestamptz default now()
);

-- Add comments to the measurements table
comment on table public.measurements is 'Stores the measurement data entered by users for their aquariums.';

-- Enable row-level security for the measurements table
alter table public.measurements enable row level security;

--
-- RLS Policies for measurements
--
-- Authenticated users can view measurements for their own aquariums.
create policy "Allow authenticated users to view their own measurements"
on public.measurements for select
to authenticated
using (exists (
    select 1
    from public.aquariums
    where aquariums.id = measurements.aquarium_id and aquariums.user_id = auth.uid()
));

-- Authenticated users can insert measurements for their own aquariums.
create policy "Allow authenticated users to insert their own measurements"
on public.measurements for insert
to authenticated
with check (exists (
    select 1
    from public.aquariums
    where aquariums.id = measurements.aquarium_id and aquariums.user_id = auth.uid()
));

-- Authenticated users can update measurements for their own aquariums.
create policy "Allow authenticated users to update their own measurements"
on public.measurements for update
to authenticated
using (exists (
    select 1
    from public.aquariums
    where aquariums.id = measurements.aquarium_id and aquariums.user_id = auth.uid()
));

-- Authenticated users can delete measurements for their own aquariums.
create policy "Allow authenticated users to delete their own measurements"
on public.measurements for delete
to authenticated
using (exists (
    select 1
    from public.aquariums
    where aquariums.id = measurements.aquarium_id and aquariums.user_id = auth.uid()
));

--
-- Create indexes
--
-- Index to efficiently query the latest measurement for a specific parameter in an aquarium.
create index idx_measurements_latest on public.measurements (aquarium_id, parameter_id, created_at desc);


