import { useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import { History, CheckCircle2, XCircle, Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MedicationLog, useMedicationLogs, Medication } from "@/hooks/useMedications";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface MedicationHistoryProps {
  medications: Medication[];
}

export function MedicationHistory({ medications }: MedicationHistoryProps) {
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("week");
  const [selectedMedication, setSelectedMedication] = useState<string>("all");

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: undefined, end: undefined };
    }
  };

  const { start, end } = getDateRange();

  const { data: logs = [], isLoading } = useMedicationLogs(
    selectedMedication === "all" ? undefined : selectedMedication,
    start,
    end
  );

  const groupedLogs = logs.reduce((groups, log) => {
    const date = format(parseISO(log.taken_at), "yyyy-MM-dd");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, MedicationLog[]>);

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Medication History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedMedication} onValueChange={setSelectedMedication}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Medications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Medications</SelectItem>
                {medications.map((med) => (
                  <SelectItem key={med.id} value={med.id}>
                    {med.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No History Found</h3>
            <p className="text-sm text-muted-foreground">
              No medication logs for the selected period.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {format(parseISO(date), "EEEE, MMMM d")}
                  </span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
                <div className="space-y-2">
                  {groupedLogs[date].map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        log.status === "taken"
                          ? "bg-success/5 border-success/20"
                          : log.status === "skipped"
                          ? "bg-warning/5 border-warning/20"
                          : "bg-destructive/5 border-destructive/20"
                      )}
                    >
                      <div
                        className={cn(
                          "p-1.5 rounded-full",
                          log.status === "taken"
                            ? "bg-success/10 text-success"
                            : log.status === "skipped"
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {log.status === "taken" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">
                          {log.medication?.name || "Unknown Medication"}
                        </span>
                        {log.notes && (
                          <p className="text-xs text-muted-foreground truncate">
                            {log.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs capitalize",
                            log.status === "taken"
                              ? "bg-success/10 text-success border-0"
                              : log.status === "skipped"
                              ? "bg-warning/10 text-warning border-0"
                              : "bg-destructive/10 text-destructive border-0"
                          )}
                        >
                          {log.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {format(parseISO(log.taken_at), "h:mm a")}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
