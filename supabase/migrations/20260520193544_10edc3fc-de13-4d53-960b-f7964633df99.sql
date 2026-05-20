ALTER TABLE public.documents ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'pdf';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS source_url text;