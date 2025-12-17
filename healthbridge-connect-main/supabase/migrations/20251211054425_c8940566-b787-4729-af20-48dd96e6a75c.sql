-- Create video call sessions table for WebRTC signaling
CREATE TABLE public.video_call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended'))
);

-- Create signaling messages table for WebRTC
CREATE TABLE public.signaling_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.video_call_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('offer', 'answer', 'ice-candidate', 'join', 'leave')),
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signaling_messages ENABLE ROW LEVEL SECURITY;

-- Policies for video_call_sessions
CREATE POLICY "Users can view their own call sessions"
ON public.video_call_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = video_call_sessions.appointment_id
    AND (a.patient_id = auth.uid() OR a.doctor_id IN (
      SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can create call sessions for their appointments"
ON public.video_call_sessions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = video_call_sessions.appointment_id
    AND (a.patient_id = auth.uid() OR a.doctor_id IN (
      SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can update their call sessions"
ON public.video_call_sessions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = video_call_sessions.appointment_id
    AND (a.patient_id = auth.uid() OR a.doctor_id IN (
      SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()
    ))
  )
);

-- Policies for signaling_messages
CREATE POLICY "Users can view signaling messages for their sessions"
ON public.signaling_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.video_call_sessions vcs
    JOIN public.appointments a ON a.id = vcs.appointment_id
    WHERE vcs.id = signaling_messages.session_id
    AND (a.patient_id = auth.uid() OR a.doctor_id IN (
      SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can insert signaling messages"
ON public.signaling_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.video_call_sessions vcs
    JOIN public.appointments a ON a.id = vcs.appointment_id
    WHERE vcs.id = signaling_messages.session_id
    AND (a.patient_id = auth.uid() OR a.doctor_id IN (
      SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()
    ))
  )
);

-- Enable realtime for signaling
ALTER PUBLICATION supabase_realtime ADD TABLE public.signaling_messages;

-- Indexes
CREATE INDEX idx_video_call_sessions_appointment ON public.video_call_sessions(appointment_id);
CREATE INDEX idx_signaling_messages_session ON public.signaling_messages(session_id);
CREATE INDEX idx_signaling_messages_created ON public.signaling_messages(created_at);