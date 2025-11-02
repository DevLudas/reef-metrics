-- =====================================================================
-- Migration: disable_all_policies
-- Description: Disables all RLS policies created in the previous migration
--              This removes all row-level security policies while keeping
--              RLS enabled on the tables for future policy implementation.
-- Created at: 2025-11-02 12:00:01 UTC
-- Affected tables: aquarium_types, parameters, aquariums,
--                  default_optimal_values, measurements
-- =====================================================================

-- =====================================================================
-- STEP 1: Drop RLS policies for aquarium_types table
-- =====================================================================
-- Remove read policies for both anonymous and authenticated users

drop policy if exists "Anonymous users can read aquarium types" on public.aquarium_types;
drop policy if exists "Authenticated users can read aquarium types" on public.aquarium_types;

-- =====================================================================
-- STEP 2: Drop RLS policies for parameters table
-- =====================================================================
-- Remove read policies for both anonymous and authenticated users

drop policy if exists "Anonymous users can read parameters" on public.parameters;
drop policy if exists "Authenticated users can read parameters" on public.parameters;

-- =====================================================================
-- STEP 3: Drop RLS policies for aquariums table
-- =====================================================================
-- Remove all CRUD policies for authenticated users and deny policy for anonymous users

drop policy if exists "Users can view their own aquariums" on public.aquariums;
drop policy if exists "Users can create their own aquariums" on public.aquariums;
drop policy if exists "Users can update their own aquariums" on public.aquariums;
drop policy if exists "Users can delete their own aquariums" on public.aquariums;
drop policy if exists "Anonymous users cannot access aquariums" on public.aquariums;

-- =====================================================================
-- STEP 4: Drop RLS policies for default_optimal_values table
-- =====================================================================
-- Remove read policies for both anonymous and authenticated users

drop policy if exists "Anonymous users can read default optimal values" on public.default_optimal_values;
drop policy if exists "Authenticated users can read default optimal values" on public.default_optimal_values;

-- =====================================================================
-- STEP 5: Drop RLS policies for measurements table
-- =====================================================================
-- Remove all CRUD policies for authenticated users and deny policy for anonymous users

drop policy if exists "Users can view measurements for their own aquariums" on public.measurements;
drop policy if exists "Users can insert measurements for their own aquariums" on public.measurements;
drop policy if exists "Users can update measurements for their own aquariums" on public.measurements;
drop policy if exists "Users can delete measurements for their own aquariums" on public.measurements;
drop policy if exists "Anonymous users cannot access measurements" on public.measurements;

-- =====================================================================
-- Migration completed successfully
-- =====================================================================
-- All RLS policies have been dropped
-- RLS remains enabled on tables but with no active policies
-- Tables are now effectively inaccessible until new policies are created
-- =====================================================================

