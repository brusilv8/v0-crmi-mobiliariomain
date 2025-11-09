-- Add finalizado and data_finalizacao columns to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS finalizado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_finalizacao TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_finalizado ON public.leads(finalizado);

-- Add comment
COMMENT ON COLUMN public.leads.finalizado IS 'Indica se o lead foi convertido em cliente e finalizado';
COMMENT ON COLUMN public.leads.data_finalizacao IS 'Data em que o lead foi marcado como finalizado';
