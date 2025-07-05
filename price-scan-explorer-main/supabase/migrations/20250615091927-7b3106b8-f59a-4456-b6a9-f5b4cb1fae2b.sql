
-- Create a global preferences table to store system-wide settings
CREATE TABLE public.global_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preference_key TEXT NOT NULL UNIQUE,
  preference_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) - allow all authenticated users to read
ALTER TABLE public.global_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy that allows all authenticated users to SELECT global preferences
CREATE POLICY "All users can view global preferences" 
  ON public.global_preferences 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create policy that allows all authenticated users to UPDATE global preferences
CREATE POLICY "All users can update global preferences" 
  ON public.global_preferences 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Create policy that allows all authenticated users to INSERT global preferences
CREATE POLICY "All users can create global preferences" 
  ON public.global_preferences 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Create an upsert function for global preferences
CREATE OR REPLACE FUNCTION public.upsert_global_preference(
  p_preference_key TEXT,
  p_preference_value TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.global_preferences (preference_key, preference_value)
  VALUES (p_preference_key, p_preference_value)
  ON CONFLICT (preference_key)
  DO UPDATE SET 
    preference_value = EXCLUDED.preference_value,
    updated_at = now();
END;
$$;

-- Insert the initial global preference for price comparison
INSERT INTO public.global_preferences (preference_key, preference_value)
VALUES ('price_comparison_selected_product_match', 'all')
ON CONFLICT (preference_key) DO NOTHING;
