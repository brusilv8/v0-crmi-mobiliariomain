-- Fix propostas status constraint to match frontend values
-- Execute this script in your Supabase SQL Editor

-- Step 1: Update existing records to use snake_case format
UPDATE public.propostas
SET status = CASE 
  WHEN status IN ('Pendente', 'pendente') THEN 'pendente'
  WHEN status IN ('Em Analise', 'Em Análise', 'em_analise', 'em analise') THEN 'em_analise'
  WHEN status IN ('Aceita', 'aceita') THEN 'aceita'
  WHEN status IN ('Recusada', 'recusada') THEN 'recusada'
  WHEN status IN ('Cancelada', 'cancelada') THEN 'cancelada'
  ELSE 'pendente' -- fallback to pendente for any unknown status
END;

-- Step 2: Drop the old constraint
ALTER TABLE public.propostas
DROP CONSTRAINT IF EXISTS propostas_status_check;

-- Step 3: Add new constraint with snake_case values
ALTER TABLE public.propostas
ADD CONSTRAINT propostas_status_check
CHECK (status IN ('pendente', 'em_analise', 'aceita', 'recusada', 'cancelada'));

-- Step 4: Set default value for new records
ALTER TABLE public.propostas
ALTER COLUMN status SET DEFAULT 'pendente';
