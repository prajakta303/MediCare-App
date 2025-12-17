import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Video, 
  Users, 
  Clock,
  Bell,
  ChevronRight,
  MessageSquare,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Settings,
  Stethoscope,
  Star,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorAppointments } from "@/hooks/useAppointments";
import { format, isToday, parseISO } from "date-fns";

const alerts = [
  { type: "urgent", message: "Lab results ready for John Smith", time: "10 min ago" },
  { type: "normal", message: "Prescription renewal request from Emily J.", time: "1 hour ago" },
  { type: "normal", message: "New message from patient Michael B.", time: "2 hours ago" },
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

export default function DoctorDashboard() {
  const { profile, user } = useAuth();
  const { data: appointments = [], isLoading } = useDoctorAppointments(user?.id || "");

  const todayAppointments = appointments.filter(apt => 
    isToday(parseISO(apt.appointment_date)) && apt.status !== 'cancelled'
  );

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const completedToday = todayAppointments.filter(apt => apt.status === 'completed').length;
  const upcomingToday = todayAppointments.filter(apt => apt.status === 'confirmed' || apt.status === 'pending').length;

  const stats = [
    { 
      label: "Today's Schedule", 
      value: todayAppointments.length.toString(), 
      icon: Calendar, 
      change: `${completedToday} done`, 
      gradient: "from-primary/20 to-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary"
    },
    { 
      label: "Pending Reviews", 
      value: pendingAppointments.length.toString(), 
      icon: FileText, 
      change: "Action needed", 
      gradient: "from-warning/20 to-warning/5",
      iconBg: "bg-warning/10",
      iconColor: "text-warning"
    },
    { 
      label: "Messages", 
      value: "8", 
      icon: MessageSquare, 
      change: "4 unread", 
      gradient: "from-accent/20 to-accent/5",
      iconBg: "bg-accent/10",
      iconColor: "text-accent"
    },
    { 
      label: "Total Patients", 
      value: "47", 
      icon: Users, 
      change: "+12 this week", 
      gradient: "from-success/20 to-success/5",
      iconBg: "bg-success/10",
      iconColor: "text-success"
    },
  ];

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '??';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'bg-success/10', text: 'text-success', icon: CheckCircle2, label: 'Completed' };
      case 'confirmed':
        return { bg: 'bg-primary/10', text: 'text-primary', icon: Clock, label: 'Confirmed' };
      case 'pending':
        return { bg: 'bg-warning/10', text: 'text-warning', icon: AlertCircle, label: 'Pending' };
      default:
        return { bg: 'bg-muted', text: 'text-muted-foreground', icon: Clock, label: status };
    }
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
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 text-primary-foreground">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <Stethoscope className="w-8 h-8 lg:w-10 lg:h-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-secondary fill-secondary" />
                      <span className="text-sm opacity-90">Welcome back</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold">
                      Dr. {profile?.first_name || ""} {profile?.last_name || "Doctor"}
                    </h1>
                    <p className="text-sm lg:text-base opacity-80 mt-1">
                      {upcomingToday > 0 
                        ? `You have ${upcomingToday} appointment${upcomingToday > 1 ? 's' : ''} remaining today`
                        : "No more appointments scheduled for today"}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="hidden sm:inline">Alerts</span>
                    <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-semibold">
                      {alerts.filter(a => a.type === 'urgent').length}
                    </span>
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm gap-2"
                    asChild
                  >
                    <Link to="/doctor/setup">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </Button>
                  {todayAppointments.some(apt => apt.type === 'video' && (apt.status === 'confirmed' || apt.status === 'pending')) && (
                    <Button 
                      size="sm" 
                      className="bg-white text-primary hover:bg-white/90 gap-2 font-semibold"
                      asChild
                    >
                      <Link to={`/telemedicine/${todayAppointments.find(apt => apt.type === 'video' && (apt.status === 'confirmed' || apt.status === 'pending'))?.id}`}>
                        <Video className="w-4 h-4" />
                        Start Next Call
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={item}>
                <Card className={`border-0 shadow-card overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                  <CardContent className={`p-5 bg-gradient-to-br ${stat.gradient}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                        <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                      </div>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {stat.change}
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Schedule */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-card overflow-hidden">
                  <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        Today's Schedule
                      </span>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        View Calendar
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading schedule...</div>
                    ) : todayAppointments.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No appointments scheduled for today</p>
                      </div>
                    ) : (
                      todayAppointments.map((apt) => {
                        const statusConfig = getStatusConfig(apt.status);
                        return (
                          <div
                            key={apt.id}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
                              apt.status === "pending" || apt.status === "confirmed"
                                ? "bg-card border-border/50 hover:bg-muted/30 hover:border-primary/20" 
                                : "bg-muted/20 border-border/30"
                            }`}
                          >
                            <div className="w-16 text-center shrink-0">
                              <div className="text-sm font-semibold">{apt.start_time.slice(0, 5)}</div>
                              <div className="text-xs text-muted-foreground">{apt.end_time.slice(0, 5)}</div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground shadow-md shrink-0">
                              {getInitials(apt.patient_profile?.first_name, apt.patient_profile?.last_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold truncate">
                                  {apt.patient_profile?.first_name} {apt.patient_profile?.last_name}
                                </span>
                                {apt.type === "video" && (
                                  <Badge variant="secondary" className="bg-accent/10 text-accent border-0 text-xs">
                                    <Video className="w-3 h-3 mr-1" />
                                    Video
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">{apt.reason || "Consultation"}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="secondary" className={`${statusConfig.bg} ${statusConfig.text} border-0`}>
                                <statusConfig.icon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              {(apt.status === "pending" || apt.status === "confirmed") && apt.type === "video" && (
                                <Button variant="default" size="sm" asChild>
                                  <Link to={`/telemedicine/${apt.id}`}>
                                    <Video className="w-4 h-4 mr-1" />
                                    Join
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Patients */}
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
                          <Users className="w-4 h-4 text-accent" />
                        </div>
                        Recent Patients
                      </span>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {appointments.slice(0, 4).map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer border border-border/50 group"
                        >
                          <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                            {getInitials(apt.patient_profile?.first_name, apt.patient_profile?.last_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {apt.patient_profile?.first_name} {apt.patient_profile?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{apt.reason || "Consultation"}</div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Alerts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-0 shadow-card overflow-hidden">
                  <CardHeader className="pb-2 bg-gradient-to-r from-destructive/10 to-transparent">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-destructive" />
                      </div>
                      Recent Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {alerts.map((alert, i) => (
                      <div
                        key={i}
                        className={`flex gap-3 p-3 rounded-xl transition-all cursor-pointer hover:scale-[1.02] ${
                          alert.type === "urgent" 
                            ? "bg-destructive/10 border border-destructive/20" 
                            : "bg-muted/30 border border-border/50"
                        }`}
                      >
                        <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                          alert.type === "urgent" ? "text-destructive" : "text-muted-foreground"
                        }`} />
                        <div>
                          <div className="text-sm">{alert.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">{alert.time}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-0 shadow-card overflow-hidden bg-gradient-to-br from-primary/5 via-card to-accent/5">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">Monthly Overview</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(), 'MMMM yyyy')}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-background/50">
                        <div className="text-2xl font-bold text-primary">156</div>
                        <div className="text-xs text-muted-foreground">Appointments</div>
                      </div>
                      <div className="p-3 rounded-xl bg-background/50">
                        <div className="text-2xl font-bold text-success">98%</div>
                        <div className="text-xs text-muted-foreground">Satisfaction</div>
                      </div>
                      <div className="p-3 rounded-xl bg-background/50">
                        <div className="text-2xl font-bold text-accent">42</div>
                        <div className="text-xs text-muted-foreground">New Patients</div>
                      </div>
                      <div className="p-3 rounded-xl bg-background/50">
                        <div className="text-2xl font-bold text-warning">8</div>
                        <div className="text-xs text-muted-foreground">Reviews</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="border-0 shadow-card overflow-hidden">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start gap-3" size="sm" asChild>
                        <Link to="/doctor/setup">
                          <Settings className="w-4 h-4" />
                          Manage Availability
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-3" size="sm">
                        <FileText className="w-4 h-4" />
                        View Reports
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-3" size="sm">
                        <MessageSquare className="w-4 h-4" />
                        Messages
                      </Button>
                    </div>
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
