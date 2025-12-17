import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format, isPast, isToday, parseISO } from "date-fns";
import {
  Calendar,
  Video,
  User,
  Clock,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Navbar } from "@/components/layout/Navbar";
import { usePatientAppointments, useCancelAppointment, Appointment } from "@/hooks/useAppointments";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Appointments() {
  const { data: appointments = [], isLoading } = usePatientAppointments();
  const cancelAppointment = useCancelAppointment();
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const upcomingAppointments = appointments.filter(
    (apt) =>
      apt.status !== "cancelled" &&
      apt.status !== "completed" &&
      !isPast(parseISO(`${apt.appointment_date}T${apt.end_time}`))
  );

  const pastAppointments = appointments.filter(
    (apt) =>
      apt.status === "completed" ||
      apt.status === "cancelled" ||
      isPast(parseISO(`${apt.appointment_date}T${apt.end_time}`))
  );

  const handleCancelAppointment = async (id: string) => {
    setCancellingId(id);
    try {
      await cancelAppointment.mutateAsync(id);
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel the appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (appointment: Appointment) => {
    const statusConfig = {
      pending: { label: "Pending", className: "bg-warning/10 text-warning border-0" },
      confirmed: { label: "Confirmed", className: "bg-success/10 text-success border-0" },
      cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-0" },
      completed: { label: "Completed", className: "bg-muted text-muted-foreground border-0" },
      "no-show": { label: "No Show", className: "bg-destructive/10 text-destructive border-0" },
    };

    const config = statusConfig[appointment.status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const appointmentDate = parseISO(appointment.appointment_date);
    const isUpcoming = !isPast(parseISO(`${appointment.appointment_date}T${appointment.end_time}`));
    const isTodayAppointment = isToday(appointmentDate);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-colors",
          isTodayAppointment && isUpcoming
            ? "bg-primary/5 border-primary/20"
            : "bg-card border-border/50 hover:bg-muted/30"
        )}
      >
        {/* Doctor Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="w-12 h-12">
            <AvatarImage
              src={appointment.doctor_profile?.profile?.avatar_url || undefined}
            />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {appointment.doctor_profile?.profile?.first_name?.[0]}
              {appointment.doctor_profile?.profile?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-medium truncate">
              Dr. {appointment.doctor_profile?.profile?.first_name}{" "}
              {appointment.doctor_profile?.profile?.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {appointment.doctor_profile?.specialty}
            </p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>
              {isTodayAppointment
                ? "Today"
                : format(appointmentDate, "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{appointment.start_time.slice(0, 5)}</span>
          </div>
          <div className="flex items-center gap-2">
            {appointment.type === "video" ? (
              <Video className="w-4 h-4 text-accent" />
            ) : (
              <User className="w-4 h-4 text-primary" />
            )}
            <span className="capitalize">{appointment.type}</span>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3">
          {getStatusBadge(appointment)}

          {isUpcoming && appointment.status !== "cancelled" && (
            <>
              {isTodayAppointment && appointment.type === "video" && (
                <Button variant="hero" size="sm" asChild>
                  <Link to={`/telemedicine/${appointment.id}`}>
                    <Video className="w-4 h-4 mr-2" />
                    Join Call
                  </Link>
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={cancellingId === appointment.id}
                  >
                    {cancellingId === appointment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this appointment with Dr.{" "}
                      {appointment.doctor_profile?.profile?.last_name}? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel Appointment
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </motion.div>
    );
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
                <h1 className="text-2xl lg:text-3xl font-bold">
                  My Appointments
                </h1>
                <p className="text-muted-foreground">
                  View and manage your scheduled appointments
                </p>
              </div>
              <Button variant="hero" asChild>
                <Link to="/appointments/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Book Appointment
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : appointments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Appointments Yet
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    You haven't booked any appointments yet. Schedule your first
                    consultation with one of our healthcare providers.
                  </p>
                  <Button variant="hero" asChild>
                    <Link to="/appointments/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Book Your First Appointment
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Tabs defaultValue="upcoming" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="upcoming" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Upcoming ({upcomingAppointments.length})
                  </TabsTrigger>
                  <TabsTrigger value="past" className="gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Past ({pastAppointments.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle>Upcoming Appointments</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {upcomingAppointments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No upcoming appointments
                        </p>
                      ) : (
                        upcomingAppointments.map((apt) => (
                          <AppointmentCard key={apt.id} appointment={apt} />
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="past">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle>Past Appointments</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {pastAppointments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No past appointments
                        </p>
                      ) : (
                        pastAppointments.map((apt) => (
                          <AppointmentCard key={apt.id} appointment={apt} />
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
