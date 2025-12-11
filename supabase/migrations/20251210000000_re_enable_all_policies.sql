-- =====================================================================
-- Migration: re_enable_all_policies
-- Description: Re-enables all RLS policies that were dropped in the
--              disable_all_policies migration. This restores proper
--              access control for all tables.
-- Created at: 2025-12-10 00:00:00 UTC
-- Affected tables: aquarium_types, parameters, aquariums,
--                  default_optimal_values, measurements
-- =====================================================================

-- =====================================================================
-- STEP 1: Re-enable RLS policies for aquarium_types table
-- =====================================================================
-- Restore read policies for both anonymous and authenticated users

create policy "Anonymous users can read aquarium types"
on public.aquarium_types for select
to anon
using (true);

create policy "Authenticated users can read aquarium types"
on public.aquarium_types for select
to authenticated
using (true);

-- =====================================================================
-- STEP 2: Re-enable RLS policies for parameters table
-- =====================================================================
-- Restore read policies for both anonymous and authenticated users

create policy "Anonymous users can read parameters"
on public.parameters for select
to anon
using (true);

create policy "Authenticated users can read parameters"
on public.parameters for select
to authenticated
using (true);

-- =====================================================================
-- STEP 3: Re-enable RLS policies for aquariums table
-- =====================================================================
-- Restore all CRUD policies for authenticated users and deny policy for anonymous users

-- Policy: Allow authenticated users to view their own aquariums
create policy "Users can view their own aquariums"
on public.aquariums for select
to authenticated
using (auth.uid() = user_id);

-- Policy: Allow authenticated users to create their own aquariums
create policy "Users can create their own aquariums"
on public.aquariums for insert
to authenticated
with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own aquariums
create policy "Users can update their own aquariums"
on public.aquariums for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to delete their own aquariums
create policy "Users can delete their own aquariums"
on public.aquariums for delete
to authenticated
using (auth.uid() = user_id);

-- Policy: Deny all access to anonymous users
create policy "Anonymous users cannot access aquariums"
on public.aquariums
to anon
using (false);

-- =====================================================================
-- STEP 4: Re-enable RLS policies for default_optimal_values table
-- =====================================================================
-- Restore read policies for both anonymous and authenticated users

create policy "Anonymous users can read default optimal values"
on public.default_optimal_values for select
to anon
using (true);

create policy "Authenticated users can read default optimal values"
on public.default_optimal_values for select
to authenticated
using (true);

-- =====================================================================
-- STEP 5: Re-enable RLS policies for measurements table
-- =====================================================================
-- Restore all CRUD policies for authenticated users and deny policy for anonymous users

-- Policy: Allow authenticated users to view measurements for their own aquariums
create policy "Users can view measurements for their own aquariums"
on public.measurements for select
to authenticated
using (
  aquarium_id in (
    select id from public.aquariums where user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to insert measurements for their own aquariums
create policy "Users can insert measurements for their own aquariums"
on public.measurements for insert
to authenticated
with check (
  aquarium_id in (
    select id from public.aquariums where user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to update measurements for their own aquariums
create policy "Users can update measurements for their own aquariums"
on public.measurements for update
to authenticated
using (
  aquarium_id in (
    select id from public.aquariums where user_id = auth.uid()
  )
)
with check (
  aquarium_id in (
    select id from public.aquariums where user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to delete measurements for their own aquariums
create policy "Users can delete measurements for their own aquariums"
on public.measurements for delete
to authenticated
using (
  aquarium_id in (
    select id from public.aquariums where user_id = auth.uid()
  )
);

-- Policy: Deny all access to anonymous users
create policy "Anonymous users cannot access measurements"
on public.measurements
to anon
using (false);

-- =====================================================================
-- Migration completed successfully
-- =====================================================================
-- All RLS policies have been restored
-- Proper access control is now in place for all tables

