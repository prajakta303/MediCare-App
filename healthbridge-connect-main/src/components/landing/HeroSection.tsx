import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Shield, 
  Clock, 
  Video,
  Star,
  CheckCircle2
} from "lucide-react";

const stats = [
  { value: "50K+", label: "Patients Served" },
  { value: "1000+", label: "Healthcare Providers" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9", label: "App Rating", icon: Star },
];

const features = [
  "HIPAA Compliant",
  "24/7 Support",
  "Secure Video Calls",
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 pt-24 pb-16 lg:pt-32 lg:pb-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Shield className="w-4 h-4" />
              HIPAA & GDPR Compliant Healthcare Platform
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Your Health,{" "}
              <span className="text-gradient-primary">Reimagined</span>
              <br />
              For Modern Life
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Connect with top healthcare providers, manage appointments, track medications, 
              and access telemedicine — all in one secure, intuitive platform.
            </p>

            {/* Features List */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  {feature}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl" asChild>
                <Link to="/register" className="flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <Link to="/demo" className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 pt-8 border-t border-border/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-1 text-2xl lg:text-3xl font-bold text-foreground">
                      {stat.value}
                      {stat.icon && <stat.icon className="w-5 h-5 text-warning fill-warning" />}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="bg-card rounded-3xl shadow-card p-6 lg:p-8 border border-border/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center">
                    <Video className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Telemedicine Ready</h3>
                    <p className="text-sm text-muted-foreground">Connect with doctors instantly</p>
                  </div>
                </div>

                {/* Mock Dashboard Preview */}
                <div className="bg-muted rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Today's Appointments</span>
                    <span className="text-xs text-muted-foreground">3 scheduled</span>
                  </div>
                  
                  {[
                    { time: "9:00 AM", doctor: "Dr. Sarah Chen", type: "Video Call", status: "success" },
                    { time: "2:30 PM", doctor: "Dr. James Wilson", type: "In-Person", status: "warning" },
                    { time: "5:00 PM", doctor: "Dr. Emily Park", type: "Video Call", status: "muted" },
                  ].map((apt, i) => (
                    <div key={i} className="flex items-center gap-3 bg-card rounded-xl p-3">
                      <div className={`w-2 h-2 rounded-full ${
                        apt.status === 'success' ? 'bg-success' : 
                        apt.status === 'warning' ? 'bg-warning' : 'bg-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{apt.doctor}</div>
                        <div className="text-xs text-muted-foreground">{apt.type}</div>
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">{apt.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-lg p-4 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Next Appointment</div>
                    <div className="text-xs text-muted-foreground">In 2 hours</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-lg p-4 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">256-bit Encrypted</div>
                    <div className="text-xs text-muted-foreground">Your data is secure</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
