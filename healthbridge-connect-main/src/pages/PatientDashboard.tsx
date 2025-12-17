import { motion } from "framer-motion";
import { 
  Calendar, 
  Video, 
  Pill, 
  FileText, 
  Bell, 
  User,
  Heart,
  Activity,
  Plus,
  ChevronRight,
  Droplets,
  Scale,
  Clock,
  Sparkles,
  Phone,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { usePatientAppointments } from "@/hooks/useAppointments";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

const medications = [
  { name: "Metformin", dosage: "500mg", time: "8:00 AM", taken: true },
  { name: "Lisinopril", dosage: "10mg", time: "8:00 AM", taken: true },
  { name: "Vitamin D3", dosage: "2000IU", time: "12:00 PM", taken: false },
  { name: "Aspirin", dosage: "81mg", time: "8:00 PM", taken: false },
];

const healthMetrics = [
  { label: "Heart Rate", value: "72", unit: "bpm", icon: Heart, color: "text-destructive", bgColor: "bg-destructive/10" },
  { label: "Blood Pressure", value: "120/80", unit: "mmHg", icon: Activity, color: "text-success", bgColor: "bg-success/10" },
  { label: "Blood Sugar", value: "95", unit: "mg/dL", icon: Droplets, color: "text-accent", bgColor: "bg-accent/10" },
  { label: "Weight", value: "165", unit: "lbs", icon: Scale, color: "text-warning", bgColor: "bg-warning/10" },
];

const quickActions = [
  { label: "Book Appointment", icon: Calendar, href: "/appointments/new", color: "from-primary/20 to-primary/5", iconColor: "text-primary" },
  { label: "My Appointments", icon: Clock, href: "/appointments", color: "from-accent/20 to-accent/5", iconColor: "text-accent" },
  { label: "Medical Records", icon: FileText, href: "/records", color: "from-success/20 to-success/5", iconColor: "text-success" },
  { label: "Medications", icon: Pill, href: "/medications", color: "from-warning/20 to-warning/5", iconColor: "text-warning" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function PatientDashboard() {
  const { profile } = useAuth();
  const { data: appointments = [], isLoading } = usePatientAppointments();
  const medicationProgress = (medications.filter(m => m.taken).length / medications.length) * 100;

  const upcomingAppointments = appointments
    .filter(apt => apt.status !== 'cancelled' && apt.status !== 'completed')
    .slice(0, 3);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatAppointmentDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '??';
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-8 text-primary-foreground">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl lg:text-3xl font-bold border border-white/30">
                    {getInitials(profile?.first_name, profile?.last_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-5 h-5 text-secondary" />
                      <span className="text-sm opacity-90">{getGreeting()}</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold">
                      {profile?.first_name || "Welcome"} {profile?.last_name || ""}
                    </h1>
                    <p className="text-sm lg:text-base opacity-80 mt-1">Your health journey starts here</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="hidden sm:inline">Notifications</span>
                    <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-semibold">3</span>
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-white text-primary hover:bg-white/90 gap-2 font-semibold"
                    asChild
                  >
                    <Link to="/appointments/new">
                      <Plus className="w-4 h-4" />
                      Book Appointment
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {quickActions.map((action) => (
              <motion.div key={action.label} variants={item}>
                <Link to={action.href} className="group block">
                  <Card className="h-full border-0 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                    <CardContent className={`p-5 bg-gradient-to-br ${action.color}`}>
                      <div className={`w-12 h-12 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                        <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                      </div>
                      <span className="font-semibold text-sm text-foreground">{action.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Health Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-card overflow-hidden">
                  <CardHeader className="pb-2 bg-gradient-to-r from-muted/50 to-transparent">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-primary" />
                        </div>
                        Health Metrics
                      </span>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {healthMetrics.map((metric) => (
                        <div 
                          key={metric.label} 
                          className="group p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer border border-border/50 hover:border-border"
                        >
                          <div className={`w-10 h-10 rounded-xl ${metric.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <metric.icon className={`w-5 h-5 ${metric.color}`} />
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold">{metric.value}</span>
                            <span className="text-xs text-muted-foreground">{metric.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Upcoming Appointments */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-0 shadow-card overflow-hidden">
                  <CardHeader className="pb-2 bg-gradient-to-r from-accent/10 to-transparent">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-accent" />
                        </div>
                        Upcoming Appointments
                      </span>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" asChild>
                        <Link to="/appointments">
                          View All
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading appointments...</div>
                    ) : upcomingAppointments.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                        <Button asChild variant="outline">
                          <Link to="/appointments/new">Book Your First Appointment</Link>
                        </Button>
                      </div>
                    ) : (
                      upcomingAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all border border-border/50 group"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground shadow-md">
                            {getInitials(apt.doctor_profile?.profile?.first_name, apt.doctor_profile?.profile?.last_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold">
                              Dr. {apt.doctor_profile?.profile?.first_name} {apt.doctor_profile?.profile?.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{apt.doctor_profile?.specialty}</div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-1">
                              {formatAppointmentDate(apt.appointment_date)}
                            </Badge>
                            <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                              {apt.type === "video" ? (
                                <Video className="w-3 h-3 text-accent" />
                              ) : (
                                <User className="w-3 h-3 text-primary" />
                              )}
                              {apt.start_time.slice(0, 5)}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Medication Tracker */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-0 shadow-card overflow-hidden">
                  <CardHeader className="pb-2 bg-gradient-to-r from-warning/10 to-transparent">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                          <Pill className="w-4 h-4 text-warning" />
                        </div>
                        Today's Meds
                      </span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {medications.filter(m => m.taken).length}/{medications.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span>{Math.round(medicationProgress)}%</span>
                      </div>
                      <Progress value={medicationProgress} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      {medications.map((med, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                            med.taken 
                              ? "bg-success/10 border border-success/20" 
                              : "bg-muted/30 border border-border/50"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            med.taken 
                              ? "bg-success text-success-foreground" 
                              : "bg-background border-2 border-border"
                          }`}>
                            {med.taken ? "✓" : <Pill className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{med.name}</div>
                            <div className="text-xs text-muted-foreground">{med.dosage} • {med.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4" asChild>
                      <Link to="/medications">Manage Medications</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-0 shadow-card overflow-hidden bg-gradient-to-br from-card to-muted/30">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Need Help?
                    </h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start gap-3" size="sm">
                        <Phone className="w-4 h-4" />
                        Contact Support
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-3" size="sm">
                        <MessageSquare className="w-4 h-4" />
                        Message Doctor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Emergency Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10 shadow-card overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-destructive" />
                      </div>
                      <div>
                        <div className="font-semibold">Emergency</div>
                        <div className="text-xs text-muted-foreground">24/7 Support Available</div>
                      </div>
                    </div>
                    <Button variant="destructive" className="w-full font-semibold">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Emergency
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
