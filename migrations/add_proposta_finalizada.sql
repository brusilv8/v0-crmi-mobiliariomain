-- Add finalizada column to propostas table
ALTER TABLE public.propostas
ADD COLUMN IF NOT EXISTS finalizada BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_propostas_finalizada ON public.propostas(finalizada);

-- Add comment
COMMENT ON COLUMN public.propostas.finalizada IS 'Indica se a proposta foi arquivada quando o lead foi finalizado';
