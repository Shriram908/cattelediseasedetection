-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vet_id UUID NOT NULL,
  cattle_id UUID REFERENCES public.cattle(id) ON DELETE SET NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments
CREATE POLICY "Farmers can view their appointments"
ON public.appointments FOR SELECT
USING (auth.uid() = farmer_id);

CREATE POLICY "Vets can view their appointments"
ON public.appointments FOR SELECT
USING (auth.uid() = vet_id);

CREATE POLICY "Farmers can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (auth.uid() = farmer_id AND has_role(auth.uid(), 'farmer'::app_role));

CREATE POLICY "Farmers can update their appointments"
ON public.appointments FOR UPDATE
USING (auth.uid() = farmer_id);

CREATE POLICY "Vets can update their appointments"
ON public.appointments FOR UPDATE
USING (auth.uid() = vet_id AND has_role(auth.uid(), 'veterinarian'::app_role));

-- Create vaccinations table
CREATE TABLE public.vaccinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cattle_id UUID NOT NULL REFERENCES public.cattle(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  vaccination_date DATE NOT NULL,
  next_due_date DATE,
  administered_by TEXT,
  batch_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vaccinations
CREATE POLICY "Cattle owners can view vaccinations"
ON public.vaccinations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.cattle
  WHERE cattle.id = vaccinations.cattle_id
  AND cattle.owner_id = auth.uid()
));

CREATE POLICY "Cattle owners can create vaccinations"
ON public.vaccinations FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.cattle
  WHERE cattle.id = vaccinations.cattle_id
  AND cattle.owner_id = auth.uid()
));

CREATE POLICY "Cattle owners can update vaccinations"
ON public.vaccinations FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.cattle
  WHERE cattle.id = vaccinations.cattle_id
  AND cattle.owner_id = auth.uid()
));

CREATE POLICY "Cattle owners can delete vaccinations"
ON public.vaccinations FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.cattle
  WHERE cattle.id = vaccinations.cattle_id
  AND cattle.owner_id = auth.uid()
));

-- Add image_url to cattle table if not exists
ALTER TABLE public.cattle ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create triggers for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vaccinations_updated_at
BEFORE UPDATE ON public.vaccinations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Add indexes for better performance
CREATE INDEX idx_appointments_farmer ON public.appointments(farmer_id);
CREATE INDEX idx_appointments_vet ON public.appointments(vet_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_vaccinations_cattle ON public.vaccinations(cattle_id);
CREATE INDEX idx_vaccinations_next_due ON public.vaccinations(next_due_date);