import { useEffect, useRef, useCallback } from "react";
import { useNotifications } from "./useNotifications";
import { useActiveMedications, Medication } from "./useMedications";
import { useAuth } from "@/contexts/AuthContext";

interface ScheduledReminder {
  medicationId: string;
  medicationName: string;
  dosage: string;
  dosageUnit: string;
  reminderTime: string;
  timeoutId: NodeJS.Timeout;
}

export function useMedicationNotifications() {
  const { user } = useAuth();
  const { permission, isSupported, sendNotification } = useNotifications();
  const { data: medications } = useActiveMedications();
  const scheduledReminders = useRef<ScheduledReminder[]>([]);

  const clearScheduledReminders = useCallback(() => {
    scheduledReminders.current.forEach((reminder) => {
      clearTimeout(reminder.timeoutId);
    });
    scheduledReminders.current = [];
  }, []);

  const scheduleReminder = useCallback(
    (medication: Medication, reminderTime: string) => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const [hours, minutes] = reminderTime.split(":");
      const reminderDate = new Date(`${today}T${hours}:${minutes}:00`);

      // If reminder time has passed today, don't schedule
      if (reminderDate <= now) return;

      const delay = reminderDate.getTime() - now.getTime();

      const timeoutId = setTimeout(() => {
        sendNotification(`Time to take ${medication.name}`, {
          body: `${medication.dosage} ${medication.dosage_unit} - ${medication.instructions || "Take as directed"}`,
          tag: `medication-${medication.id}-${reminderTime}`,
          requireInteraction: true,
        });
      }, delay);

      scheduledReminders.current.push({
        medicationId: medication.id,
        medicationName: medication.name,
        dosage: medication.dosage,
        dosageUnit: medication.dosage_unit,
        reminderTime,
        timeoutId,
      });
    },
    [sendNotification]
  );

  useEffect(() => {
    if (!user || permission !== "granted" || !medications) {
      clearScheduledReminders();
      return;
    }

    clearScheduledReminders();

    const today = new Date().getDay();

    medications.forEach((medication) => {
      if (!medication.reminders) return;

      medication.reminders.forEach((reminder) => {
        if (!reminder.is_enabled) return;
        if (!reminder.days_of_week?.includes(today)) return;

        scheduleReminder(medication, reminder.reminder_time);
      });
    });

    return () => {
      clearScheduledReminders();
    };
  }, [user, permission, medications, scheduleReminder, clearScheduledReminders]);

  // Reschedule at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      // This will trigger a re-run of the scheduling effect
      window.location.reload();
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, []);

  return {
    isSupported,
    permission,
    scheduledCount: scheduledReminders.current.length,
  };
}
