import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: "post" | "comment";
  contentId: string;
}

interface ReportForm {
  reason: string;
  description: string;
}

const reportReasons = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "misinformation", label: "Medical misinformation" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "mental_health", label: "Mental health concern" },
  { value: "other", label: "Other" },
];

export const ReportDialog = ({ open, onOpenChange, contentType, contentId }: ReportDialogProps) => {
  const { user } = useAuth();
  const { register, handleSubmit, reset, setValue, watch } = useForm<ReportForm>();
  const selectedReason = watch("reason");

  const reportMutation = useMutation({
    mutationFn: async (data: ReportForm) => {
      const { error } = await (supabase as any).from("community_reports").insert({
        content_type: contentType,
        content_id: contentId,
        reporter_id: user!.id,
        reason: data.reason,
        description: data.description,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted. Our team will review it shortly.");
      onOpenChange(false);
      reset();
    },
    onError: () => {
      toast.error("Failed to submit report");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle>Report Content</DialogTitle>
              <DialogDescription>
                Help us maintain a safe community by reporting inappropriate content.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => reportMutation.mutate(data))} className="space-y-6">
          <div className="space-y-3">
            <Label>Why are you reporting this?</Label>
            <RadioGroup onValueChange={(value) => setValue("reason", value)}>
              {reportReasons.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Please provide any additional context that might help us review this report..."
              rows={4}
            />
          </div>

          {selectedReason === "mental_health" && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> If someone is in immediate danger, please contact emergency services. 
                Our team will prioritize mental health concerns and may reach out to offer support resources.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={!selectedReason || reportMutation.isPending}
            >
              {reportMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
