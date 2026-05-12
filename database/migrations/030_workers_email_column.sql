-- App (src/lib/workers.js) reads/writes workers.email. If migration 013 was never applied
-- on a project, PostgREST returns: could not find the 'email' column of 'workers' in the schema cache.

ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_email ON public.workers (email);
