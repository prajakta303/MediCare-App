import { motion } from "framer-motion";
import { 
  Calendar, 
  Video, 
  Pill, 
  FileText, 
  Bell, 
  Users, 
  Shield, 
  Scan,
  MessageSquare,
  Activity
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Book appointments with ease. Our AI-powered system finds the perfect time slots based on your preferences and provider availability.",
    color: "primary",
  },
  {
    icon: Video,
    title: "HD Telemedicine",
    description: "Crystal-clear video consultations with top healthcare providers. Secure, private, and accessible from anywhere.",
    color: "accent",
  },
  {
    icon: Pill,
    title: "Medication Tracker",
    description: "Never miss a dose. Smart reminders, refill alerts, and comprehensive medication history at your fingertips.",
    color: "success",
  },
  {
    icon: Scan,
    title: "AI Prescription Scanner",
    description: "Scan prescriptions with your camera. Our AI detects drug interactions and provides safety alerts instantly.",
    color: "warning",
  },
  {
    icon: FileText,
    title: "Medical Records",
    description: "Your complete health history in one place. Share records securely with any healthcare provider.",
    color: "secondary",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Real-time notifications for appointments, medication reminders, and important health updates.",
    color: "primary",
  },
  {
    icon: Users,
    title: "Patient Community",
    description: "Connect with others on similar health journeys. Share experiences and support each other.",
    color: "accent",
  },
  {
    icon: Shield,
    title: "HIPAA Compliant",
    description: "Enterprise-grade security with end-to-end encryption. Your health data stays private and protected.",
    color: "success",
  },
];

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  secondary: "bg-secondary/10 text-secondary",
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Activity className="w-4 h-4" />
            Comprehensive Healthcare Features
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Everything You Need for{" "}
            <span className="text-gradient-primary">Better Health</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From scheduling appointments to managing medications, our platform provides 
            all the tools you need for a seamless healthcare experience.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-card rounded-2xl p-6 border border-border/50 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 p-2 rounded-full bg-muted">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-primary border-2 border-background flex items-center justify-center text-xs font-medium text-primary-foreground"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="pr-4">
              <span className="text-sm">
                <span className="font-semibold">50,000+</span>{" "}
                <span className="text-muted-foreground">patients trust MediCare+</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
