import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pill, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/Navbar";
import { MedicationCard } from "@/components/medications/MedicationCard";
import { AddMedicationDialog } from "@/components/medications/AddMedicationDialog";
import { TodaySchedule } from "@/components/medications/TodaySchedule";
import { MedicationHistory } from "@/components/medications/MedicationHistory";
import { AdherenceStats } from "@/components/medications/AdherenceStats";
import { NotificationSettings } from "@/components/medications/NotificationSettings";
import {
  useMedications,
  useTodayLogs,
  useMedicationLogs,
  Medication,
} from "@/hooks/useMedications";
import { startOfWeek, endOfWeek } from "date-fns";

export default function Medications() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  const { data: medications = [], isLoading } = useMedications();
  const { data: todayLogs = [] } = useTodayLogs();

  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const { data: weekLogs = [] } = useMedicationLogs(undefined, weekStart, weekEnd);

  const activeMedications = medications.filter((m) => m.is_active);
  const inactiveMedications = medications.filter((m) => !m.is_active);

  const getTakenMedicationIds = () => {
    return new Set(todayLogs.map((log) => log.medication_id));
  };

  const takenIds = getTakenMedicationIds();

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setIsAddDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setEditingMedication(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
                  <Pill className="w-8 h-8 text-primary" />
                  Medication Tracker
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your medications and never miss a dose
                </p>
              </div>
              <Button variant="hero" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Notification Settings & Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid gap-4 md:grid-cols-2"
              >
                <NotificationSettings />
                <AdherenceStats medications={medications} logs={weekLogs} />
              </motion.div>

              {/* Main Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Tabs defaultValue="today" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="medications">
                      My Medications ({medications.length})
                    </TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="today" className="space-y-6">
                    <TodaySchedule
                      medications={activeMedications}
                      todayLogs={todayLogs}
                    />
                  </TabsContent>

                  <TabsContent value="medications" className="space-y-6">
                    {medications.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-16 text-center"
                      >
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Pill className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          No Medications Added
                        </h3>
                        <p className="text-muted-foreground max-w-md mb-6">
                          Start tracking your medications by adding your first one.
                          Set reminders to never miss a dose.
                        </p>
                        <Button
                          variant="hero"
                          onClick={() => setIsAddDialogOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Medication
                        </Button>
                      </motion.div>
                    ) : (
                      <>
                        {activeMedications.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                              Active Medications
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                              {activeMedications.map((med) => (
                                <MedicationCard
                                  key={med.id}
                                  medication={med}
                                  onEdit={handleEdit}
                                  takenToday={takenIds.has(med.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {inactiveMedications.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                              Inactive Medications
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                              {inactiveMedications.map((med) => (
                                <MedicationCard
                                  key={med.id}
                                  medication={med}
                                  onEdit={handleEdit}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="history">
                    <MedicationHistory medications={medications} />
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      <AddMedicationDialog
        open={isAddDialogOpen}
        onOpenChange={handleDialogClose}
        medication={editingMedication}
      />
    </div>
  );
}
