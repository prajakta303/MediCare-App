import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  Save,
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const SPECIALTIES = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Pediatrician",
  "Psychiatrist",
  "Orthopedic",
  "Ophthalmologist",
  "ENT Specialist",
  "Gynecologist",
  "Urologist",
  "Dentist",
  "Other",
];

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_available: boolean;
}

interface DoctorProfileData {
  specialty: string;
  bio: string;
  years_experience: number;
  consultation_fee: number;
  accepts_video: boolean;
  accepts_in_person: boolean;
}

export default function DoctorSetup() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<DoctorProfileData>({
    specialty: "",
    bio: "",
    years_experience: 0,
    consultation_fee: 0,
    accepts_video: true,
    accepts_in_person: true,
  });

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);

  useEffect(() => {
    if (role !== "doctor") {
      navigate("/");
      return;
    }
    loadDoctorData();
  }, [role, user]);

  const loadDoctorData = async () => {
    if (!user) return;

    try {
      // Load doctor profile
      const { data: profile } = await supabase
        .from("doctor_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setDoctorProfileId(profile.id);
        setProfileData({
          specialty: profile.specialty,
          bio: profile.bio || "",
          years_experience: profile.years_experience,
          consultation_fee: Number(profile.consultation_fee),
          accepts_video: profile.accepts_video,
          accepts_in_person: profile.accepts_in_person,
        });

        // Load availability
        const { data: availabilityData } = await supabase
          .from("doctor_availability")
          .select("*")
          .eq("doctor_id", profile.id);

        if (availabilityData) {
          setAvailability(
            availabilityData.map((a) => ({
              day_of_week: a.day_of_week,
              start_time: a.start_time,
              end_time: a.end_time,
              slot_duration: a.slot_duration,
              is_available: a.is_available,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error loading doctor data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Save or update doctor profile
      let profileId = doctorProfileId;

      if (profileId) {
        await supabase
          .from("doctor_profiles")
          .update({
            specialty: profileData.specialty,
            bio: profileData.bio,
            years_experience: profileData.years_experience,
            consultation_fee: profileData.consultation_fee,
            accepts_video: profileData.accepts_video,
            accepts_in_person: profileData.accepts_in_person,
          })
          .eq("id", profileId);
      } else {
        const { data: newProfile, error } = await supabase
          .from("doctor_profiles")
          .insert({
            user_id: user.id,
            specialty: profileData.specialty,
            bio: profileData.bio,
            years_experience: profileData.years_experience,
            consultation_fee: profileData.consultation_fee,
            accepts_video: profileData.accepts_video,
            accepts_in_person: profileData.accepts_in_person,
          })
          .select()
          .single();

        if (error) throw error;
        profileId = newProfile.id;
        setDoctorProfileId(profileId);
      }

      // Delete existing availability and re-insert
      if (profileId) {
        await supabase
          .from("doctor_availability")
          .delete()
          .eq("doctor_id", profileId);

        if (availability.length > 0) {
          await supabase.from("doctor_availability").insert(
            availability.map((slot) => ({
              doctor_id: profileId,
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time,
              slot_duration: slot.slot_duration,
              is_available: slot.is_available,
            }))
          );
        }
      }

      toast({
        title: "Profile Saved",
        description: "Your doctor profile and availability have been updated.",
      });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addAvailabilitySlot = () => {
    const usedDays = availability.map((a) => a.day_of_week);
    const nextAvailableDay = DAYS_OF_WEEK.find(
      (d) => !usedDays.includes(d.value)
    );

    if (!nextAvailableDay) {
      toast({
        title: "All Days Added",
        description: "You have added availability for all days of the week.",
      });
      return;
    }

    setAvailability([
      ...availability,
      {
        day_of_week: nextAvailableDay.value,
        start_time: "09:00",
        end_time: "17:00",
        slot_duration: 30,
        is_available: true,
      },
    ]);
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const updateAvailabilitySlot = (
    index: number,
    field: keyof AvailabilitySlot,
    value: any
  ) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/doctor")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl lg:text-3xl font-bold">
              Doctor Profile Setup
            </h1>
            <p className="text-muted-foreground">
              Configure your profile and availability for patients to book
              appointments
            </p>
          </motion.div>

          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/50 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Specialty</Label>
                    <Select
                      value={profileData.specialty}
                      onValueChange={(v) =>
                        setProfileData({ ...profileData, specialty: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALTIES.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Years of Experience</Label>
                    <Input
                      type="number"
                      min="0"
                      value={profileData.years_experience}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          years_experience: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    placeholder="Tell patients about yourself and your expertise..."
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData({ ...profileData, bio: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Consultation Fee ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={profileData.consultation_fee}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          consultation_fee: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={profileData.accepts_video}
                      onCheckedChange={(v) =>
                        setProfileData({ ...profileData, accepts_video: v })
                      }
                    />
                    <Label>Accept Video Consultations</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={profileData.accepts_in_person}
                      onCheckedChange={(v) =>
                        setProfileData({ ...profileData, accepts_in_person: v })
                      }
                    />
                    <Label>Accept In-Person Visits</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Availability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Weekly Availability
                  </div>
                  <Button variant="outline" size="sm" onClick={addAvailabilitySlot}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Day
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availability.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No availability set. Add your working days to allow patients
                    to book appointments.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {availability.map((slot, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex flex-wrap items-center gap-4 p-4 rounded-xl border",
                          slot.is_available
                            ? "bg-card border-border/50"
                            : "bg-muted/50 border-border/30"
                        )}
                      >
                        <div className="w-32">
                          <Select
                            value={slot.day_of_week.toString()}
                            onValueChange={(v) =>
                              updateAvailabilitySlot(
                                index,
                                "day_of_week",
                                parseInt(v)
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_OF_WEEK.map((day) => (
                                <SelectItem
                                  key={day.value}
                                  value={day.value.toString()}
                                >
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) =>
                              updateAvailabilitySlot(
                                index,
                                "start_time",
                                e.target.value
                              )
                            }
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) =>
                              updateAvailabilitySlot(
                                index,
                                "end_time",
                                e.target.value
                              )
                            }
                            className="w-32"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={slot.slot_duration.toString()}
                            onValueChange={(v) =>
                              updateAvailabilitySlot(
                                index,
                                "slot_duration",
                                parseInt(v)
                              )
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 min</SelectItem>
                              <SelectItem value="30">30 min</SelectItem>
                              <SelectItem value="45">45 min</SelectItem>
                              <SelectItem value="60">60 min</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <Switch
                            checked={slot.is_available}
                            onCheckedChange={(v) =>
                              updateAvailabilitySlot(index, "is_available", v)
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAvailabilitySlot(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              variant="hero"
              size="lg"
              onClick={handleSave}
              disabled={isSaving || !profileData.specialty}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
