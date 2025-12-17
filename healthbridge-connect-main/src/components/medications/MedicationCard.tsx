import { useState } from "react";
import { motion } from "framer-motion";
import {
  Pill,
  Clock,
  Bell,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Medication, useDeleteMedication, useLogMedication } from "@/hooks/useMedications";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface MedicationCardProps {
  medication: Medication;
  onEdit: (medication: Medication) => void;
  takenToday?: boolean;
}

const colorClasses: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
};

export function MedicationCard({ medication, onEdit, takenToday = false }: MedicationCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteMedication = useDeleteMedication();
  const logMedication = useLogMedication();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteMedication.mutateAsync(medication.id);
      toast({
        title: "Medication Deleted",
        description: `${medication.name} has been removed from your list.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete medication.",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
  };

  const handleTakeMedication = async () => {
    try {
      await logMedication.mutateAsync({
        medicationId: medication.id,
        status: "taken",
      });
      toast({
        title: "Medication Logged",
        description: `${medication.name} marked as taken.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log medication.",
        variant: "destructive",
      });
    }
  };

  const colorClass = colorClasses[medication.color] || colorClasses.primary;
  const activeReminders = medication.reminders?.filter((r) => r.is_enabled) || [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <Card
          className={cn(
            "border-border/50 transition-all duration-200 hover:shadow-md",
            !medication.is_active && "opacity-60"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Icon & Info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={cn("p-2.5 rounded-xl border", colorClass)}>
                  <Pill className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{medication.name}</h3>
                    {!medication.is_active && (
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                    {takenToday && (
                      <Badge className="bg-success/10 text-success border-0 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Taken
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {medication.dosage} {medication.dosage_unit} • {medication.frequency}
                  </p>
                  {medication.instructions && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {medication.instructions}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {medication.is_active && !takenToday && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTakeMedication}
                    disabled={logMedication.isPending}
                    className="hidden sm:flex"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Take Now
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {medication.is_active && !takenToday && (
                      <DropdownMenuItem onClick={handleTakeMedication}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Take Now
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEdit(medication)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Reminders & Schedule */}
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/50">
              {activeReminders.length > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Bell className="w-3.5 h-3.5" />
                  <span>
                    {activeReminders.map((r) => r.reminder_time.slice(0, 5)).join(", ")}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>No reminders set</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Since {format(parseISO(medication.start_date), "MMM d, yyyy")}</span>
              </div>

              {medication.end_date && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Until {format(parseISO(medication.end_date), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medication?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {medication.name}? This will also remove all
              associated reminders and logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
