import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DoctorProfile {
  id: string;
  user_id: string;
  specialty: string;
  license_number: string | null;
  bio: string | null;
  years_experience: number;
  consultation_fee: number;
  accepts_video: boolean;
  accepts_in_person: boolean;
  profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_available: boolean;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  type: "video" | "in-person";
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no-show";
  reason: string | null;
  notes: string | null;
  created_at: string;
  doctor_profile?: DoctorProfile;
  patient_profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface CreateAppointmentData {
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  type: "video" | "in-person";
  reason?: string;
}

export function useDoctors() {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data: doctorProfiles, error } = await supabase
        .from("doctor_profiles")
        .select("*");

      if (error) throw error;

      // Fetch profiles for each doctor
      const doctorsWithProfiles = await Promise.all(
        (doctorProfiles || []).map(async (doctor) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, avatar_url")
            .eq("user_id", doctor.user_id)
            .maybeSingle();

          return {
            ...doctor,
            profile: profile || { first_name: "Doctor", last_name: "", avatar_url: null },
          };
        })
      );

      return doctorsWithProfiles as DoctorProfile[];
    },
  });
}

export function useDoctorAvailability(doctorId: string | null) {
  return useQuery({
    queryKey: ["doctor-availability", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];

      const { data, error } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("is_available", true);

      if (error) throw error;
      return data as DoctorAvailability[];
    },
    enabled: !!doctorId,
  });
}

export function useDoctorAppointmentsByDate(doctorId: string | null, date: string | null) {
  return useQuery({
    queryKey: ["doctor-appointments-by-date", doctorId, date],
    queryFn: async () => {
      if (!doctorId || !date) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("appointment_date", date)
        .neq("status", "cancelled");

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!doctorId && !!date,
  });
}

export function useDoctorAppointments(userId: string | null) {
  return useQuery({
    queryKey: ["doctor-all-appointments", userId],
    queryFn: async () => {
      if (!userId) return [];

      // First get the doctor profile for this user
      const { data: doctorProfile } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!doctorProfile) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", doctorProfile.id)
        .order("appointment_date", { ascending: true });

      if (error) throw error;

      // Fetch patient profiles for each appointment
      const appointmentsWithPatients = await Promise.all(
        (data || []).map(async (apt) => {
          const { data: patientProfile } = await supabase
            .from("profiles")
            .select("first_name, last_name, avatar_url")
            .eq("user_id", apt.patient_id)
            .maybeSingle();

          return {
            ...apt,
            patient_profile: patientProfile || { first_name: "Patient", last_name: "", avatar_url: null },
          };
        })
      );

      return appointmentsWithPatients as Appointment[];
    },
    enabled: !!userId,
  });
}

export function usePatientAppointments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["patient-appointments", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", user.id)
        .order("appointment_date", { ascending: true });

      if (error) throw error;

      // Fetch doctor profiles for each appointment
      const appointmentsWithDoctors = await Promise.all(
        (data || []).map(async (apt) => {
          const { data: doctorProfile } = await supabase
            .from("doctor_profiles")
            .select("*")
            .eq("id", apt.doctor_id)
            .maybeSingle();

          let profile = null;
          if (doctorProfile) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("first_name, last_name, avatar_url")
              .eq("user_id", doctorProfile.user_id)
              .maybeSingle();
            profile = profileData;
          }

          return {
            ...apt,
            doctor_profile: doctorProfile
              ? { ...doctorProfile, profile }
              : null,
          };
        })
      );

      return appointmentsWithDoctors as Appointment[];
    },
    enabled: !!user,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      if (!user) throw new Error("Not authenticated");

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          patient_id: user.id,
          doctor_id: data.doctor_id,
          appointment_date: data.appointment_date,
          start_time: data.start_time,
          end_time: data.end_time,
          type: data.type,
          reason: data.reason,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    },
  });
}

// Helper function to generate time slots
export function generateTimeSlots(
  availability: DoctorAvailability | undefined,
  existingAppointments: Appointment[],
  selectedDate: Date
): string[] {
  if (!availability) return [];

  const slots: string[] = [];
  const startParts = availability.start_time.split(":");
  const endParts = availability.end_time.split(":");

  let currentHour = parseInt(startParts[0]);
  let currentMinute = parseInt(startParts[1]);
  const endHour = parseInt(endParts[0]);
  const endMinute = parseInt(endParts[1]);

  const bookedSlots = existingAppointments.map((apt) => apt.start_time.slice(0, 5));

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute
      .toString()
      .padStart(2, "0")}`;

    // Check if slot is not booked
    if (!bookedSlots.includes(timeString)) {
      // Check if slot is in the future
      const now = new Date();
      const slotDate = new Date(selectedDate);
      slotDate.setHours(currentHour, currentMinute, 0, 0);

      if (slotDate > now) {
        slots.push(timeString);
      }
    }

    currentMinute += availability.slot_duration;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
}
