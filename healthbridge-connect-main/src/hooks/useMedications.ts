import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  dosage_unit: string;
  frequency: string;
  instructions: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  reminders?: MedicationReminder[];
}

export interface MedicationReminder {
  id: string;
  medication_id: string;
  reminder_time: string;
  days_of_week: number[];
  is_enabled: boolean;
  created_at: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  user_id: string;
  taken_at: string;
  scheduled_time: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  medication?: Medication;
}

export interface CreateMedicationInput {
  name: string;
  dosage: string;
  dosage_unit: string;
  frequency: string;
  instructions?: string;
  start_date: string;
  end_date?: string;
  color?: string;
  icon?: string;
  reminders?: { reminder_time: string; days_of_week: number[] }[];
}

export function useMedications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["medications", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("medications")
        .select(`
          *,
          reminders:medication_reminders(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Medication[];
    },
    enabled: !!user,
  });
}

export function useActiveMedications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["medications", "active", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("medications")
        .select(`
          *,
          reminders:medication_reminders(*)
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Medication[];
    },
    enabled: !!user,
  });
}

export function useMedicationLogs(medicationId?: string, startDate?: Date, endDate?: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["medication-logs", user?.id, medicationId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("medication_logs")
        .select(`
          *,
          medication:medications(*)
        `)
        .eq("user_id", user.id)
        .order("taken_at", { ascending: false });

      if (medicationId) {
        query = query.eq("medication_id", medicationId);
      }

      if (startDate) {
        query = query.gte("taken_at", startDate.toISOString());
      }

      if (endDate) {
        query = query.lte("taken_at", endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MedicationLog[];
    },
    enabled: !!user,
  });
}

export function useTodayLogs() {
  const { user } = useAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return useQuery({
    queryKey: ["medication-logs", "today", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("medication_logs")
        .select(`
          *,
          medication:medications(*)
        `)
        .eq("user_id", user.id)
        .gte("taken_at", today.toISOString())
        .lt("taken_at", tomorrow.toISOString())
        .order("taken_at", { ascending: false });

      if (error) throw error;
      return data as MedicationLog[];
    },
    enabled: !!user,
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateMedicationInput) => {
      if (!user) throw new Error("User not authenticated");

      const { reminders, ...medicationData } = input;

      // Create medication
      const { data: medication, error: medError } = await supabase
        .from("medications")
        .insert({
          ...medicationData,
          user_id: user.id,
        } as any)
        .select()
        .single();

      if (medError) throw medError;

      // Create reminders if provided
      if (reminders && reminders.length > 0) {
        const reminderInserts = reminders.map((r) => ({
          medication_id: medication.id,
          reminder_time: r.reminder_time,
          days_of_week: r.days_of_week,
        }));

        const { error: remError } = await supabase
          .from("medication_reminders")
          .insert(reminderInserts as any);

        if (remError) throw remError;
      }

      return medication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

export function useUpdateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Medication> & { id: string }) => {
      const { data, error } = await supabase
        .from("medications")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

export function useDeleteMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("medications")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

export function useLogMedication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      medicationId,
      scheduledTime,
      status = "taken",
      notes,
    }: {
      medicationId: string;
      scheduledTime?: string;
      status?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("medication_logs")
        .insert({
          medication_id: medicationId,
          user_id: user.id,
          scheduled_time: scheduledTime,
          status,
          notes,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication-logs"] });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MedicationReminder> & { id: string }) => {
      const { data, error } = await supabase
        .from("medication_reminders")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

export function useAddReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      medicationId,
      reminderTime,
      daysOfWeek = [0, 1, 2, 3, 4, 5, 6],
    }: {
      medicationId: string;
      reminderTime: string;
      daysOfWeek?: number[];
    }) => {
      const { data, error } = await supabase
        .from("medication_reminders")
        .insert({
          medication_id: medicationId,
          reminder_time: reminderTime,
          days_of_week: daysOfWeek,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("medication_reminders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}
