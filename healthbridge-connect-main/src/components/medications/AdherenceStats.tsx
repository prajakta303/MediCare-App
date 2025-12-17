import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, Calendar, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO } from "date-fns";
import { MedicationLog, Medication } from "@/hooks/useMedications";
import { cn } from "@/lib/utils";

interface AdherenceStatsProps {
  medications: Medication[];
  logs: MedicationLog[];
}

export function AdherenceStats({ medications, logs }: AdherenceStatsProps) {
  const stats = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Calculate expected doses this week
    let expectedDoses = 0;
    let actualDoses = 0;

    medications.forEach((med) => {
      if (!med.is_active) return;

      med.reminders?.forEach((reminder) => {
        if (!reminder.is_enabled) return;

        daysOfWeek.forEach((day) => {
          const dayOfWeek = day.getDay();
          if (reminder.days_of_week.includes(dayOfWeek)) {
            expectedDoses++;

            // Check if taken
            const wasTaken = logs.some(
              (log) =>
                log.medication_id === med.id &&
                isSameDay(parseISO(log.taken_at), day) &&
                log.status === "taken"
            );

            if (wasTaken) actualDoses++;
          }
        });
      });
    });

    const adherenceRate = expectedDoses > 0 ? (actualDoses / expectedDoses) * 100 : 0;

    // Calculate streak
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const dayLogs = logs.filter(
        (log) =>
          isSameDay(parseISO(log.taken_at), checkDate) && log.status === "taken"
      );

      // Get expected medications for this day
      const dayOfWeek = checkDate.getDay();
      let expectedForDay = 0;

      medications.forEach((med) => {
        if (!med.is_active) return;
        med.reminders?.forEach((reminder) => {
          if (reminder.is_enabled && reminder.days_of_week.includes(dayOfWeek)) {
            expectedForDay++;
          }
        });
      });

      if (expectedForDay === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }

      if (dayLogs.length >= expectedForDay) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }

      if (streak > 365) break; // Safety limit
    }

    return {
      adherenceRate: Math.round(adherenceRate),
      takenThisWeek: actualDoses,
      expectedThisWeek: expectedDoses,
      streak,
      activeMedications: medications.filter((m) => m.is_active).length,
    };
  }, [medications, logs]);

  const statCards = [
    {
      icon: Target,
      label: "Weekly Adherence",
      value: `${stats.adherenceRate}%`,
      subtext: `${stats.takenThisWeek}/${stats.expectedThisWeek} doses`,
      color: stats.adherenceRate >= 80 ? "text-success" : stats.adherenceRate >= 50 ? "text-warning" : "text-destructive",
      progress: stats.adherenceRate,
    },
    {
      icon: Award,
      label: "Current Streak",
      value: `${stats.streak} days`,
      subtext: "Keep it up!",
      color: "text-accent",
    },
    {
      icon: TrendingUp,
      label: "Active Medications",
      value: stats.activeMedications.toString(),
      subtext: "In your regimen",
      color: "text-primary",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-border/50 h-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2 rounded-lg bg-muted/50", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              </div>
              {stat.progress !== undefined && (
                <Progress value={stat.progress} className="h-1.5 mt-3" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
