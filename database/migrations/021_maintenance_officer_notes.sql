-- Officer-entered notes on maintenance tasks (separate from auto description)
ALTER TABLE public.maintenance_tasks
ADD COLUMN IF NOT EXISTS officer_notes TEXT;
