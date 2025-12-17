-- Create doctor_profiles table for additional doctor info
CREATE TABLE public.doctor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  specialty TEXT NOT NULL,
  license_number TEXT,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  accepts_video BOOLEAN DEFAULT true,
  accepts_in_person BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor_availability table for weekly schedule
CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER DEFAULT 30, -- in minutes
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, day_of_week)
);

-- Create appointment_type enum
CREATE TYPE public.appointment_type AS ENUM ('video', 'in-person');

-- Create appointment_status enum  
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no-show');

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type appointment_type NOT NULL DEFAULT 'video',
  status appointment_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_profiles
CREATE POLICY "Doctor profiles are viewable by everyone"
ON public.doctor_profiles FOR SELECT
USING (true);

CREATE POLICY "Doctors can update their own profile"
ON public.doctor_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert their own profile"
ON public.doctor_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for doctor_availability
CREATE POLICY "Doctor availability is viewable by everyone"
ON public.doctor_availability FOR SELECT
USING (true);

CREATE POLICY "Doctors can manage their own availability"
ON public.doctor_availability FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.doctor_profiles
    WHERE id = doctor_availability.doctor_id
    AND user_id = auth.uid()
  )
);

-- RLS Policies for appointments
CREATE POLICY "Patients can view their own appointments"
ON public.appointments FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view their appointments"
ON public.appointments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.doctor_profiles
    WHERE id = appointments.doctor_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Patients can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own appointments"
ON public.appointments FOR UPDATE
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can update their appointments"
ON public.appointments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.doctor_profiles
    WHERE id = appointments.doctor_id
    AND user_id = auth.uid()
  )
);

-- Trigger for updating timestamps
CREATE TRIGGER update_doctor_profiles_updated_at
  BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster appointment queries
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_doctor_availability_doctor ON public.doctor_availability(doctor_id);