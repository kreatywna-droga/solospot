-- 0010_update_templates_table.sql
-- Add missing columns to the templates table to match the seed script

ALTER TABLE public.templates 
ADD COLUMN screenshots text[] NOT NULL DEFAULT '{}',
ADD COLUMN live_demo_url text,
ADD COLUMN includes text[] NOT NULL DEFAULT '{}',
ADD COLUMN features text[] NOT NULL DEFAULT '{}',
ADD COLUMN products jsonb NOT NULL DEFAULT '[]'::jsonb;
