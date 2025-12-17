import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Bell, Pill } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateMedication, Medication, useUpdateMedication, useAddReminder, useDeleteReminder } from "@/hooks/useMedications";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  dosage_unit: z.string().min(1, "Unit is required"),
  frequency: z.string().min(1, "Frequency is required"),
  instructions: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  color: z.string().default("primary"),
});

type FormValues = z.infer<typeof formSchema>;

interface ReminderInput {
  id?: string;
  time: string;
  days: number[];
}

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "twice_daily", label: "Twice Daily" },
  { value: "three_times_daily", label: "Three Times Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "as_needed", label: "As Needed" },
  { value: "custom", label: "Custom" },
];

const UNITS = ["mg", "ml", "g", "mcg", "IU", "tablets", "capsules", "drops", "puffs"];

const COLORS = [
  { value: "primary", class: "bg-primary" },
  { value: "accent", class: "bg-accent" },
  { value: "success", class: "bg-success" },
  { value: "warning", class: "bg-warning" },
  { value: "destructive", class: "bg-destructive" },
];

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication?: Medication | null;
}

export function AddMedicationDialog({
  open,
  onOpenChange,
  medication,
}: AddMedicationDialogProps) {
  const isEditing = !!medication;
  const createMedication = useCreateMedication();
  const updateMedication = useUpdateMedication();
  const addReminder = useAddReminder();
  const deleteReminder = useDeleteReminder();
  const { toast } = useToast();

  const [reminders, setReminders] = useState<ReminderInput[]>(
    medication?.reminders?.map((r) => ({
      id: r.id,
      time: r.reminder_time.slice(0, 5),
      days: r.days_of_week,
    })) || []
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: medication?.name || "",
      dosage: medication?.dosage || "",
      dosage_unit: medication?.dosage_unit || "mg",
      frequency: medication?.frequency || "daily",
      instructions: medication?.instructions || "",
      start_date: medication?.start_date || new Date().toISOString().split("T")[0],
      end_date: medication?.end_date || "",
      color: medication?.color || "primary",
    },
  });

  const addReminderSlot = () => {
    setReminders([...reminders, { time: "08:00", days: [0, 1, 2, 3, 4, 5, 6] }]);
  };

  const removeReminder = async (index: number) => {
    const reminder = reminders[index];
    if (reminder.id) {
      try {
        await deleteReminder.mutateAsync(reminder.id);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete reminder.",
          variant: "destructive",
        });
        return;
      }
    }
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const updateReminderTime = (index: number, time: string) => {
    const updated = [...reminders];
    updated[index].time = time;
    setReminders(updated);
  };

  const toggleReminderDay = (index: number, day: number) => {
    const updated = [...reminders];
    const days = updated[index].days;
    if (days.includes(day)) {
      updated[index].days = days.filter((d) => d !== day);
    } else {
      updated[index].days = [...days, day].sort();
    }
    setReminders(updated);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && medication) {
        // Update medication
        await updateMedication.mutateAsync({
          id: medication.id,
          ...values,
        });

        // Handle reminders
        const existingIds = medication.reminders?.map((r) => r.id) || [];
        const currentIds = reminders.filter((r) => r.id).map((r) => r.id!);

        // Add new reminders
        for (const reminder of reminders) {
          if (!reminder.id) {
            await addReminder.mutateAsync({
              medicationId: medication.id,
              reminderTime: `${reminder.time}:00`,
              daysOfWeek: reminder.days,
            });
          }
        }

        toast({
          title: "Medication Updated",
          description: `${values.name} has been updated.`,
        });
      } else {
        // Create new medication with reminders
        await createMedication.mutateAsync({
          name: values.name,
          dosage: values.dosage,
          dosage_unit: values.dosage_unit,
          frequency: values.frequency,
          instructions: values.instructions,
          start_date: values.start_date,
          end_date: values.end_date,
          color: values.color,
          reminders: reminders.map((r) => ({
            reminder_time: `${r.time}:00`,
            days_of_week: r.days,
          })),
        });

        toast({
          title: "Medication Added",
          description: `${values.name} has been added to your list.`,
        });
      }

      onOpenChange(false);
      form.reset();
      setReminders([]);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "add"} medication.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            {isEditing ? "Edit Medication" : "Add New Medication"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Aspirin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dosage_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Take with food"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Color Picker */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="flex gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => field.onChange(color.value)}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all",
                            color.class,
                            field.value === color.value
                              ? "ring-2 ring-offset-2 ring-foreground"
                              : "opacity-60 hover:opacity-100"
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reminders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Reminders
                </FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addReminderSlot}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Reminder
                </Button>
              </div>

              {reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reminders set. Add one to get notified.
                </p>
              ) : (
                <div className="space-y-3">
                  {reminders.map((reminder, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border border-border/50 bg-muted/30 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <Input
                          type="time"
                          value={reminder.time}
                          onChange={(e) => updateReminderTime(index, e.target.value)}
                          className="w-32"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeReminder(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {DAYS.map((day) => (
                          <Badge
                            key={day.value}
                            variant={reminder.days.includes(day.value) ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer transition-all",
                              reminder.days.includes(day.value)
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                            onClick={() => toggleReminderDay(index, day.value)}
                          >
                            {day.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMedication.isPending || updateMedication.isPending}
              >
                {isEditing ? "Save Changes" : "Add Medication"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
