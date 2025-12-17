import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Patient",
    avatar: "SM",
    rating: 5,
    text: "MediCare+ has completely transformed how I manage my health. Booking appointments is a breeze, and the telemedicine feature saved me during the pandemic.",
  },
  {
    name: "Dr. James Wilson",
    role: "Cardiologist",
    avatar: "JW",
    rating: 5,
    text: "As a healthcare provider, this platform has streamlined my practice. The patient management tools are intuitive, and the secure messaging keeps communication efficient.",
  },
  {
    name: "Emily Rodriguez",
    role: "Patient",
    avatar: "ER",
    rating: 5,
    text: "The medication tracker with reminders has been a game-changer for my elderly parents. They never miss a dose anymore, and I can monitor their health remotely.",
  },
  {
    name: "Dr. Amanda Chen",
    role: "Family Medicine",
    avatar: "AC",
    rating: 5,
    text: "The AI prescription scanner caught a potential drug interaction that we might have missed. It's an invaluable safety feature for any healthcare practice.",
  },
  {
    name: "Michael Thompson",
    role: "Patient",
    avatar: "MT",
    rating: 5,
    text: "Being able to access my complete medical history from any device is incredibly convenient. The interface is clean and easy to navigate.",
  },
  {
    name: "Dr. Robert Park",
    role: "Pediatrician",
    avatar: "RP",
    rating: 5,
    text: "Parents love being able to schedule appointments online and message us directly. It's reduced our administrative workload significantly.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-32 bg-background overflow-hidden">
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
            Trusted by{" "}
            <span className="text-gradient-primary">Thousands</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            See what patients and healthcare providers are saying about their experience with MediCare+.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-card rounded-2xl p-6 border border-border/50 shadow-card hover:shadow-lg transition-all duration-300">
                {/* Quote Icon */}
                <div className="mb-4">
                  <Quote className="w-8 h-8 text-primary/20" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
