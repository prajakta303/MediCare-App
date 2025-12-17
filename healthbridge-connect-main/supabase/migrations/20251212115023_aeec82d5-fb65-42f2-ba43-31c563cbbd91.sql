-- Create medications table
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  dosage_unit TEXT NOT NULL DEFAULT 'mg',
  frequency TEXT NOT NULL DEFAULT 'daily',
  instructions TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  color TEXT DEFAULT 'primary',
  icon TEXT DEFAULT 'pill',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication reminders table
CREATE TABLE public.medication_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  reminder_time TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication logs table
CREATE TABLE public.medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'taken',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- Medications policies
CREATE POLICY "Users can view their own medications"
  ON public.medications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medications"
  ON public.medications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications"
  ON public.medications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications"
  ON public.medications FOR DELETE
  USING (auth.uid() = user_id);

-- Medication reminders policies
CREATE POLICY "Users can view reminders for their medications"
  ON public.medication_reminders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.medications
    WHERE medications.id = medication_reminders.medication_id
    AND medications.user_id = auth.uid()
  ));

CREATE POLICY "Users can create reminders for their medications"
  ON public.medication_reminders FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.medications
    WHERE medications.id = medication_reminders.medication_id
    AND medications.user_id = auth.uid()
  ));

CREATE POLICY "Users can update reminders for their medications"
  ON public.medication_reminders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.medications
    WHERE medications.id = medication_reminders.medication_id
    AND medications.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete reminders for their medications"
  ON public.medication_reminders FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.medications
    WHERE medications.id = medication_reminders.medication_id
    AND medications.user_id = auth.uid()
  ));

-- Medication logs policies
CREATE POLICY "Users can view their own medication logs"
  ON public.medication_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medication logs"
  ON public.medication_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication logs"
  ON public.medication_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication logs"
  ON public.medication_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_medications_is_active ON public.medications(is_active);
CREATE INDEX idx_medication_reminders_medication_id ON public.medication_reminders(medication_id);
CREATE INDEX idx_medication_logs_medication_id ON public.medication_logs(medication_id);
CREATE INDEX idx_medication_logs_user_id ON public.medication_logs(user_id);
CREATE INDEX idx_medication_logs_taken_at ON public.medication_logs(taken_at);

-- Trigger for updated_at
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();