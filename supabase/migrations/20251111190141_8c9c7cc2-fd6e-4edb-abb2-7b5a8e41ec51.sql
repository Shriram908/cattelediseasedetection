-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('farmer', 'veterinarian');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update handle_new_user function to create user_role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'farmer'::app_role)
  );
  
  RETURN NEW;
END;
$$;

-- Remove role column from profiles (data migration)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Create storage bucket for cattle images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cattle-images', 'cattle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for cattle images
CREATE POLICY "Authenticated users can upload cattle images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cattle-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view cattle images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cattle-images');

CREATE POLICY "Users can update their own cattle images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'cattle-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own cattle images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'cattle-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create veterinarians table for directory
CREATE TABLE public.veterinarians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  clinic_name TEXT NOT NULL,
  specialization TEXT,
  experience_years INTEGER,
  license_number TEXT,
  clinic_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT,
  phone TEXT NOT NULL,
  consultation_fee NUMERIC,
  available_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  consultation_hours TEXT DEFAULT '9:00 AM - 6:00 PM',
  latitude NUMERIC,
  longitude NUMERIC,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on veterinarians
ALTER TABLE public.veterinarians ENABLE ROW LEVEL SECURITY;

-- RLS policies for veterinarians
CREATE POLICY "Anyone can view verified veterinarians"
ON public.veterinarians
FOR SELECT
USING (is_verified = true);

CREATE POLICY "Veterinarians can insert their own profile"
ON public.veterinarians
FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'veterinarian'));

CREATE POLICY "Veterinarians can update their own profile"
ON public.veterinarians
FOR UPDATE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'veterinarian'));

-- Trigger for updated_at on veterinarians
CREATE TRIGGER update_veterinarians_updated_at
BEFORE UPDATE ON public.veterinarians
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();