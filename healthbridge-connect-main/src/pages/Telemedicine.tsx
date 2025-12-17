import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/layout/Navbar";
import { VideoPlayer } from "@/components/telemedicine/VideoPlayer";
import { CallControls } from "@/components/telemedicine/CallControls";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

interface AppointmentDetails {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  reason: string | null;
  doctor_profile?: {
    specialty: string;
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
  patient_profile?: {
    first_name: string;
    last_name: string;
  };
}

export default function Telemedicine() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(true);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);

  // Fetch or create video call session
  useEffect(() => {
    async function initializeSession() {
      if (!appointmentId || !user) return;

      try {
        setIsLoadingAppointment(true);

        // Fetch appointment details with related data
        const { data: appointmentData, error: aptError } = await supabase
          .from("appointments")
          .select(`
            *,
            doctor_profile:doctor_profiles!appointments_doctor_id_fkey (
              specialty,
              user_id
            )
          `)
          .eq("id", appointmentId)
          .maybeSingle();

        if (aptError) throw aptError;
        if (!appointmentData) {
          setAppointmentError("Appointment not found");
          return;
        }

        // Fetch doctor's profile info
        let doctorProfile = null;
        if (appointmentData.doctor_profile?.user_id) {
          const { data: docProfile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("user_id", appointmentData.doctor_profile.user_id)
            .maybeSingle();
          doctorProfile = docProfile;
        }

        // Fetch patient's profile info
        const { data: patientProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", appointmentData.patient_id)
          .maybeSingle();

        setAppointment({
          ...appointmentData,
          doctor_profile: appointmentData.doctor_profile
            ? {
                specialty: appointmentData.doctor_profile.specialty,
                profile: doctorProfile || undefined,
              }
            : undefined,
          patient_profile: patientProfile || undefined,
        });

        // Check for existing session or create new one
        const { data: existingSession } = await supabase
          .from("video_call_sessions")
          .select("id")
          .eq("appointment_id", appointmentId)
          .eq("status", "waiting")
          .maybeSingle();

        if (existingSession) {
          setSessionId(existingSession.id);
        } else {
          // Create new session
          const { data: newSession, error: sessionError } = await supabase
            .from("video_call_sessions")
            .insert({ appointment_id: appointmentId } as any)
            .select("id")
            .single();

          if (sessionError) throw sessionError;
          setSessionId(newSession.id);
        }
      } catch (err: any) {
        console.error("Error initializing session:", err);
        setAppointmentError(err.message || "Failed to load appointment");
      } finally {
        setIsLoadingAppointment(false);
      }
    }

    initializeSession();
  }, [appointmentId, user]);

  // WebRTC hook
  const {
    localStream,
    remoteStream,
    isConnected,
    isConnecting,
    error: webRTCError,
    isMuted,
    isVideoOff,
    participantJoined,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useWebRTC({
    sessionId: sessionId || "",
    appointmentId: appointmentId || "",
  });

  const handleEndCall = async () => {
    await endCall();
    navigate(-1);
  };

  const getOtherParticipantName = () => {
    if (!appointment) return "Participant";
    if (role === "doctor") {
      return appointment.patient_profile
        ? `${appointment.patient_profile.first_name} ${appointment.patient_profile.last_name}`
        : "Patient";
    }
    return appointment.doctor_profile?.profile
      ? `Dr. ${appointment.doctor_profile.profile.first_name} ${appointment.doctor_profile.profile.last_name}`
      : "Doctor";
  };

  if (isLoadingAppointment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (appointmentError || !appointment) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 lg:px-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {appointmentError || "Unable to load appointment"}
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/appointments">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Appointments
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/appointments">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <Badge variant="outline" className="text-primary border-primary">
                Video Consultation
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Telemedicine Session</h1>
                <p className="text-muted-foreground">
                  {format(parseISO(appointment.appointment_date), "MMMM d, yyyy")} at{" "}
                  {appointment.start_time.slice(0, 5)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {participantJoined || isConnected
                    ? "Participant joined"
                    : "Waiting for participant..."}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Error Alert */}
          {webRTCError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{webRTCError}</AlertDescription>
            </Alert>
          )}

          {/* Video Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
          >
            {/* Main Video (Remote) */}
            <div className="lg:col-span-2">
              <VideoPlayer
                stream={remoteStream}
                isVideoOff={!remoteStream}
                label={getOtherParticipantName()}
                className="aspect-video w-full"
              />
            </div>

            {/* Local Video */}
            <div className="lg:col-span-1">
              <VideoPlayer
                stream={localStream}
                muted
                isLocal
                isVideoOff={isVideoOff}
                label="You"
                className="aspect-video w-full"
              />

              {/* Appointment Info */}
              <Card className="mt-4 border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">With</span>
                    <p className="font-medium">{getOtherParticipantName()}</p>
                    {role === "patient" && appointment.doctor_profile?.specialty && (
                      <p className="text-sm text-muted-foreground">
                        {appointment.doctor_profile.specialty}
                      </p>
                    )}
                  </div>
                  {appointment.reason && (
                    <div>
                      <span className="text-sm text-muted-foreground">Reason</span>
                      <p className="text-sm">{appointment.reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Call Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <Card className="border-border/50 px-8 py-4">
              <CallControls
                isConnected={isConnected}
                isConnecting={isConnecting}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                onEndCall={handleEndCall}
                onStartCall={startCall}
                hasLocalStream={!!localStream}
              />
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
