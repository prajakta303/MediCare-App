import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Pill, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Medication, MedicationLog, useLogMedication } from "@/hooks/useMedications";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  medication: Medication;
  reminder: { id: string; time: string };
  taken: boolean;
}

interface TodayScheduleProps {
  medications: Medication[];
  todayLogs: MedicationLog[];
}

export function TodaySchedule({ medications, todayLogs }: TodayScheduleProps) {
  const logMedication = useLogMedication();
  const { toast } = useToast();
  const today = new Date().getDay();

  const schedule = useMemo(() => {
    const items: ScheduleItem[] = [];

    medications.forEach((med) => {
      if (!med.is_active) return;

      med.reminders?.forEach((reminder) => {
        if (reminder.is_enabled && reminder.days_of_week.includes(today)) {
          const taken = todayLogs.some(
            (log) =>
              log.medication_id === med.id &&
              log.scheduled_time === reminder.reminder_time
          );

          items.push({
            medication: med,
            reminder: { id: reminder.id, time: reminder.reminder_time },
            taken,
          });
        }
      });
    });

    return items.sort((a, b) => a.reminder.time.localeCompare(b.reminder.time));
  }, [medications, todayLogs, today]);

  const takenCount = schedule.filter((s) => s.taken).length;
  const progress = schedule.length > 0 ? (takenCount / schedule.length) * 100 : 0;

  const handleTake = async (item: ScheduleItem) => {
    try {
      await logMedication.mutateAsync({
        medicationId: item.medication.id,
        scheduledTime: item.reminder.time,
        status: "taken",
      });
      toast({
        title: "Medication Taken",
        description: `${item.medication.name} marked as taken.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log medication.",
        variant: "destructive",
      });
    }
  };

  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return currentTime;
  };

  const currentTime = getCurrentTimeSlot();

  if (schedule.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Medications Scheduled</h3>
          <p className="text-sm text-muted-foreground text-center">
            You have no medications scheduled for today. Add reminders to your medications.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Today's Schedule
          </CardTitle>
          <Badge variant="outline" className="font-normal">
            {takenCount}/{schedule.length} taken
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mt-3" />
      </CardHeader>
      <CardContent className="space-y-2">
        {schedule.map((item, index) => {
          const isPast = item.reminder.time < currentTime;
          const isCurrent =
            item.reminder.time <= currentTime &&
            item.reminder.time >
              new Date(Date.now() - 60 * 60 * 1000)
                .toTimeString()
                .slice(0, 5);

          return (
            <motion.div
              key={`${item.medication.id}-${item.reminder.id}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                item.taken
                  ? "bg-success/5 border-success/20"
                  : isCurrent
                  ? "bg-primary/5 border-primary/30"
                  : isPast && !item.taken
                  ? "bg-destructive/5 border-destructive/20"
                  : "bg-muted/30 border-border/50"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg",
                  item.taken
                    ? "bg-success/10 text-success"
                    : "bg-primary/10 text-primary"
                )}
              >
                {item.taken ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Pill className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {item.medication.name}
                  </span>
                  {isPast && !item.taken && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-destructive/10 text-destructive border-0"
                    >
                      Missed
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.medication.dosage} {item.medication.dosage_unit}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium tabular-nums">
                  {item.reminder.time.slice(0, 5)}
                </span>
                {!item.taken && (
                  <Button
                    variant={isCurrent ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTake(item)}
                    disabled={logMedication.isPending}
                    className="h-8"
                  >
                    Take
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
