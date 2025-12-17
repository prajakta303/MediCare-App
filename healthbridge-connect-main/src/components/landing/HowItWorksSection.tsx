import { motion } from "framer-motion";
import { UserPlus, Search, Calendar, Video, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Account",
    description: "Sign up in minutes with our secure, HIPAA-compliant registration. Your health information is encrypted from day one.",
  },
  {
    number: "02",
    icon: Search,
    title: "Find Your Provider",
    description: "Browse our network of certified healthcare professionals. Filter by specialty, location, availability, and patient reviews.",
  },
  {
    number: "03",
    icon: Calendar,
    title: "Book Appointment",
    description: "Choose your preferred time slot. Our smart scheduling system syncs with provider calendars in real-time.",
  },
  {
    number: "04",
    icon: Video,
    title: "Start Your Visit",
    description: "Connect via HD video call or visit in person. Access your records, prescriptions, and follow-ups all in one place.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Healthcare Made{" "}
            <span className="text-gradient-primary">Simple</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Getting started with MediCare+ takes just minutes. Here's how to begin your journey to better health.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-20 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              <div className="text-center">
                {/* Step Number */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg relative z-10">
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center text-sm font-bold text-primary z-20">
                    {step.number}
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <Button variant="hero" size="xl" asChild>
            <Link to="/register" className="flex items-center gap-2">
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
