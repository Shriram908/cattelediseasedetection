-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table with role (farmer or veterinarian)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('farmer', 'veterinarian')),
  phone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create cattle profiles table
CREATE TABLE IF NOT EXISTS public.cattle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cattle_tag TEXT,
  age INTEGER,
  breed TEXT,
  weight DECIMAL,
  farm_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create diseases information table
CREATE TABLE IF NOT EXISTS public.diseases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  symptoms TEXT[] NOT NULL,
  home_remedies TEXT[] NOT NULL,
  precautions TEXT[] NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Mild', 'Moderate', 'Severe', 'Critical')),
  veterinarian_recommended BOOLEAN NOT NULL DEFAULT false,
  urgency TEXT CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')),
  treatment_duration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create diagnosis reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cattle_id UUID NOT NULL REFERENCES public.cattle(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  diagnosis_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  image_url TEXT,
  selected_symptoms TEXT[],
  predicted_disease TEXT NOT NULL,
  confidence_score DECIMAL NOT NULL,
  ml_model_used TEXT NOT NULL,
  severity TEXT NOT NULL,
  veterinarian_recommended BOOLEAN NOT NULL,
  treatment_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create veterinarian notes table
CREATE TABLE IF NOT EXISTS public.vet_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  vet_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT NOT NULL,
  follow_up_date DATE,
  treatment_status TEXT CHECK (treatment_status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cattle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for cattle
CREATE POLICY "Users can view their own cattle"
  ON public.cattle FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create cattle profiles"
  ON public.cattle FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own cattle"
  ON public.cattle FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own cattle"
  ON public.cattle FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for diseases (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view diseases"
  ON public.diseases FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for reports
CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON public.reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Veterinarians can view reports they're treating"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vet_notes
      WHERE vet_notes.report_id = reports.id
        AND vet_notes.vet_id = auth.uid()
    )
  );

-- RLS Policies for vet_notes
CREATE POLICY "Veterinarians can view their own notes"
  ON public.vet_notes FOR SELECT
  USING (auth.uid() = vet_id);

CREATE POLICY "Veterinarians can create notes"
  ON public.vet_notes FOR INSERT
  WITH CHECK (auth.uid() = vet_id);

CREATE POLICY "Veterinarians can update their own notes"
  ON public.vet_notes FOR UPDATE
  USING (auth.uid() = vet_id);

CREATE POLICY "Report owners can view vet notes on their reports"
  ON public.vet_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = vet_notes.report_id
        AND reports.user_id = auth.uid()
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'farmer')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cattle_updated_at
  BEFORE UPDATE ON public.cattle
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vet_notes_updated_at
  BEFORE UPDATE ON public.vet_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert common cattle diseases data
INSERT INTO public.diseases (name, description, symptoms, home_remedies, precautions, severity, veterinarian_recommended, urgency, treatment_duration) VALUES
('Mastitis', 'Inflammation of the mammary gland and udder tissue', ARRAY['udder_swelling', 'udder_heat', 'udder_redness', 'udder_pain', 'milk_clots', 'milk_flakes'], ARRAY['Apply warm compress to udder', 'Frequent milking to remove infected milk', 'Clean udder with antiseptic solution', 'Isolate affected animal'], ARRAY['Maintain hygiene during milking', 'Dry udder after milking', 'Use proper milking technique', 'Regular udder health checks'], 'Moderate', true, 'High', '7-14 days'),
('Foot-and-Mouth Disease', 'Highly contagious viral disease affecting cloven-hoofed animals', ARRAY['blisters', 'lameness', 'fever', 'drooling', 'loss_of_appetite', 'painful_tongue'], ARRAY['Immediate isolation of affected animals', 'Disinfection of all equipment and premises', 'Provide soft food and water'], ARRAY['Vaccinate entire herd immediately', 'Quarantine new animals', 'Restrict visitor access', 'Notify veterinary authorities'], 'Critical', true, 'Critical', '21+ days'),
('Foot Rot', 'Bacterial infection of the hoof causing lameness', ARRAY['lameness', 'swelling', 'foul_odor', 'reluctance_to_move'], ARRAY['Clean affected hoof thoroughly', 'Apply copper sulfate solution', 'Keep animal in dry area', 'Trim overgrown hooves'], ARRAY['Maintain dry bedding', 'Regular hoof trimming', 'Foot baths with disinfectant', 'Avoid muddy areas'], 'Moderate', true, 'Medium', '10-14 days'),
('Bloat', 'Gas accumulation in the rumen causing distension', ARRAY['gaseous_stomach', 'difficulty_breathing', 'distended_abdomen', 'restlessness'], ARRAY['Massage left flank area', 'Walk the animal', 'Administer anti-bloat agents', 'Keep animal standing'], ARRAY['Gradual introduction to lush pasture', 'Avoid feeding wet legumes', 'Provide dry roughage before grazing', 'Monitor feed changes carefully'], 'Severe', true, 'Critical', '1-3 days'),
('Pneumonia', 'Lung inflammation causing respiratory distress', ARRAY['coughing', 'difficulty_breathing', 'fever', 'nasal_discharge', 'loss_of_appetite'], ARRAY['Keep animal warm and dry', 'Ensure good ventilation', 'Provide clean water', 'Isolate from healthy animals'], ARRAY['Vaccinate calves', 'Avoid overcrowding', 'Maintain proper ventilation', 'Reduce stress during transport'], 'Severe', true, 'High', '14-21 days');