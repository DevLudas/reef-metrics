-- Migration: remove_policies
-- Description: Removes all RLS policies from tables
-- Created at: 2025-10-27 10:00:01 UTC

-- Remove policies from aquarium_types table
drop policy if exists "Allow public read access to aquarium types" on public.aquarium_types;
drop policy if exists "Disallow all write access to aquarium types" on public.aquarium_types;

-- Remove policies from parameters table
drop policy if exists "Allow public read access to parameters" on public.parameters;
drop policy if exists "Disallow all write access to parameters" on public.parameters;

-- Remove policies from aquariums table
drop policy if exists "Allow authenticated users to select their own aquariums" on public.aquariums;
drop policy if exists "Allow authenticated users to insert their own aquariums" on public.aquariums;
drop policy if exists "Allow authenticated users to update their own aquariums" on public.aquariums;
drop policy if exists "Allow authenticated users to delete their own aquariums" on public.aquariums;

-- Remove policies from default_optimal_values table
drop policy if exists "Allow public read access to default optimal values" on public.default_optimal_values;
drop policy if exists "Disallow all write access to default optimal values" on public.default_optimal_values;

-- Remove policies from measurements table
drop policy if exists "Allow authenticated users to view their own measurements" on public.measurements;
drop policy if exists "Allow authenticated users to insert their own measurements" on public.measurements;
drop policy if exists "Allow authenticated users to update their own measurements" on public.measurements;
drop policy if exists "Allow authenticated users to delete their own measurements" on public.measurements;
