import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, addMinutes, parse } from "date-fns";
import {
  Calendar as CalendarIcon,
  Video,
  User,
  Clock,
  ArrowLeft,
  ArrowRight,
  Check,
  Stethoscope,
  MapPin,
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useDoctors,
  useDoctorAvailability,
  useDoctorAppointmentsByDate,
  useCreateAppointment,
  generateTimeSlots,
  DoctorProfile,
} from "@/hooks/useAppointments";

type Step = "doctor" | "datetime" | "confirm";

export default function BookAppointment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("doctor");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<"video" | "in-person">("video");
  const [reason, setReason] = useState("");

  const { data: doctors = [], isLoading: loadingDoctors } = useDoctors();
  const { data: availability = [] } = useDoctorAvailability(selectedDoctor?.id || null);
  const { data: existingAppointments = [] } = useDoctorAppointmentsByDate(
    selectedDoctor?.id || null,
    selectedDate ? format(selectedDate, "yyyy-MM-dd") : null
  );
  const createAppointment = useCreateAppointment();

  // Get availability for selected date
  const selectedDayAvailability = useMemo(() => {
    if (!selectedDate || !availability.length) return undefined;
    const dayOfWeek = selectedDate.getDay();
    return availability.find((a) => a.day_of_week === dayOfWeek);
  }, [selectedDate, availability]);

  // Generate available time slots
  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedDayAvailability) return [];
    return generateTimeSlots(selectedDayAvailability, existingAppointments, selectedDate);
  }, [selectedDate, selectedDayAvailability, existingAppointments]);

  // Get available days of week for the calendar
  const availableDaysOfWeek = useMemo(() => {
    return availability.filter((a) => a.is_available).map((a) => a.day_of_week);
  }, [availability]);

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // Disable days doctor is not available
    if (availableDaysOfWeek.length > 0 && !availableDaysOfWeek.includes(date.getDay())) {
      return true;
    }
    
    return false;
  };

  const handleNextStep = () => {
    if (currentStep === "doctor" && selectedDoctor) {
      setCurrentStep("datetime");
    } else if (currentStep === "datetime" && selectedDate && selectedTime) {
      setCurrentStep("confirm");
    }
  };

  const handlePrevStep = () => {
    if (currentStep === "datetime") {
      setCurrentStep("doctor");
      setSelectedDate(undefined);
      setSelectedTime(null);
    } else if (currentStep === "confirm") {
      setCurrentStep("datetime");
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;

    const startTime = selectedTime;
    const slotDuration = selectedDayAvailability?.slot_duration || 30;
    const startDateTime = parse(startTime, "HH:mm", new Date());
    const endDateTime = addMinutes(startDateTime, slotDuration);
    const endTime = format(endDateTime, "HH:mm");

    try {
      await createAppointment.mutateAsync({
        doctor_id: selectedDoctor.id,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: startTime,
        end_time: endTime,
        type: appointmentType,
        reason: reason || undefined,
      });

      toast({
        title: "Appointment Booked!",
        description: `Your appointment with Dr. ${selectedDoctor.profile?.last_name} is confirmed.`,
      });

      navigate("/patient");
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Could not book the appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const steps = [
    { id: "doctor", label: "Select Doctor", icon: Stethoscope },
    { id: "datetime", label: "Date & Time", icon: CalendarIcon },
    { id: "confirm", label: "Confirm", icon: Check },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl lg:text-3xl font-bold">Book Appointment</h1>
            <p className="text-muted-foreground">
              Schedule a consultation with one of our healthcare providers
            </p>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                      currentStep === step.id
                        ? "bg-primary text-primary-foreground"
                        : steps.findIndex((s) => s.id === currentStep) > index
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <step.icon className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2",
                        steps.findIndex((s) => s.id === currentStep) > index
                          ? "bg-success"
                          : "bg-muted"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {/* Step 1: Select Doctor */}
            {currentStep === "doctor" && (
              <motion.div
                key="doctor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Choose a Healthcare Provider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingDoctors ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : doctors.length === 0 ? (
                      <div className="text-center py-12">
                        <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No doctors available at the moment.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {doctors.map((doctor) => (
                          <div
                            key={doctor.id}
                            onClick={() => setSelectedDoctor(doctor)}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                              selectedDoctor?.id === doctor.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <Avatar className="w-16 h-16">
                              <AvatarImage
                                src={doctor.profile?.avatar_url || undefined}
                              />
                              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                                {doctor.profile?.first_name?.[0]}
                                {doctor.profile?.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">
                                  Dr. {doctor.profile?.first_name}{" "}
                                  {doctor.profile?.last_name}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  {doctor.specialty}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {doctor.bio || "Healthcare professional"}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-warning fill-warning" />
                                  {doctor.years_experience} years exp.
                                </span>
                                {doctor.accepts_video && (
                                  <span className="flex items-center gap-1">
                                    <Video className="w-3 h-3 text-accent" />
                                    Video
                                  </span>
                                )}
                                {doctor.accepts_in_person && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-primary" />
                                    In-person
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                ${doctor.consultation_fee}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                per session
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end mt-6">
                  <Button
                    variant="hero"
                    onClick={handleNextStep}
                    disabled={!selectedDoctor}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Date & Time */}
            {currentStep === "datetime" && (
              <motion.div
                key="datetime"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Calendar */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        Select Date
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setSelectedTime(null);
                        }}
                        disabled={isDateDisabled}
                        className="rounded-md border pointer-events-auto"
                      />
                      {availability.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-4 text-center">
                          This doctor has not set up their availability yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Time Slots & Type */}
                  <div className="space-y-6">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Select Time
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {!selectedDate ? (
                          <p className="text-muted-foreground text-center py-4">
                            Please select a date first
                          </p>
                        ) : availableSlots.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            No available slots for this date
                          </p>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {availableSlots.map((slot) => (
                              <Button
                                key={slot}
                                variant={
                                  selectedTime === slot ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setSelectedTime(slot)}
                                className={cn(
                                  selectedTime === slot &&
                                    "bg-primary text-primary-foreground"
                                )}
                              >
                                {slot}
                              </Button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>Appointment Type</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={appointmentType}
                          onValueChange={(v) =>
                            setAppointmentType(v as "video" | "in-person")
                          }
                          className="grid grid-cols-2 gap-4"
                        >
                          {selectedDoctor?.accepts_video && (
                            <Label
                              htmlFor="video"
                              className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                appointmentType === "video"
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <RadioGroupItem
                                value="video"
                                id="video"
                                className="sr-only"
                              />
                              <Video
                                className={cn(
                                  "w-6 h-6",
                                  appointmentType === "video"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                )}
                              />
                              <div>
                                <div className="font-medium">Video Call</div>
                                <div className="text-xs text-muted-foreground">
                                  Online consultation
                                </div>
                              </div>
                            </Label>
                          )}
                          {selectedDoctor?.accepts_in_person && (
                            <Label
                              htmlFor="in-person"
                              className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                appointmentType === "in-person"
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <RadioGroupItem
                                value="in-person"
                                id="in-person"
                                className="sr-only"
                              />
                              <User
                                className={cn(
                                  "w-6 h-6",
                                  appointmentType === "in-person"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                )}
                              />
                              <div>
                                <div className="font-medium">In-Person</div>
                                <div className="text-xs text-muted-foreground">
                                  Visit the clinic
                                </div>
                              </div>
                            </Label>
                          )}
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={handlePrevStep}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    variant="hero"
                    onClick={handleNextStep}
                    disabled={!selectedDate || !selectedTime}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Confirm Your Appointment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Doctor Info */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                      <Avatar className="w-16 h-16">
                        <AvatarImage
                          src={selectedDoctor?.profile?.avatar_url || undefined}
                        />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                          {selectedDoctor?.profile?.first_name?.[0]}
                          {selectedDoctor?.profile?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">
                          Dr. {selectedDoctor?.profile?.first_name}{" "}
                          {selectedDoctor?.profile?.last_name}
                        </h3>
                        <p className="text-muted-foreground">
                          {selectedDoctor?.specialty}
                        </p>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Date
                          </div>
                          <div className="font-medium">
                            {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                        <Clock className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Time
                          </div>
                          <div className="font-medium">{selectedTime}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                        {appointmentType === "video" ? (
                          <Video className="w-5 h-5 text-accent" />
                        ) : (
                          <MapPin className="w-5 h-5 text-accent" />
                        )}
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Type
                          </div>
                          <div className="font-medium capitalize">
                            {appointmentType === "video"
                              ? "Video Call"
                              : "In-Person Visit"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                        <span className="text-lg">💰</span>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Fee
                          </div>
                          <div className="font-medium">
                            ${selectedDoctor?.consultation_fee}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                      <Label htmlFor="reason">
                        Reason for Visit (Optional)
                      </Label>
                      <Textarea
                        id="reason"
                        placeholder="Briefly describe your symptoms or reason for the appointment..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={handlePrevStep}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    variant="hero"
                    onClick={handleBookAppointment}
                    disabled={createAppointment.isPending}
                  >
                    {createAppointment.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
