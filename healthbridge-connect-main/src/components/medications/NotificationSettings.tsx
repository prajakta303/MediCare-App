import { Bell, BellOff, BellRing, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/hooks/useNotifications";
import { useMedicationNotifications } from "@/hooks/useMedicationNotifications";
import { cn } from "@/lib/utils";

export function NotificationSettings() {
  const { permission, isSupported, requestPermission } = useNotifications();
  const { scheduledCount } = useMedicationNotifications();

  if (!isSupported) {
    return (
      <Card className="border-border/50 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BellOff className="h-4 w-4 text-muted-foreground" />
            Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  return (
    <Card className={cn(
      "border-border/50 transition-colors",
      permission === "granted" && "bg-success/5 border-success/30"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {permission === "granted" ? (
            <BellRing className="h-4 w-4 text-success" />
          ) : permission === "denied" ? (
            <BellOff className="h-4 w-4 text-destructive" />
          ) : (
            <Bell className="h-4 w-4 text-muted-foreground" />
          )}
          Medication Reminders
        </CardTitle>
        <CardDescription>
          {permission === "granted"
            ? "You'll receive browser notifications for your scheduled medications."
            : permission === "denied"
            ? "Notifications are blocked. Enable them in your browser settings."
            : "Get notified when it's time to take your medications."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {permission === "default" && (
          <Button onClick={handleRequestPermission} variant="hero" size="sm" className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
        )}

        {permission === "granted" && (
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {scheduledCount > 0
                ? `${scheduledCount} reminder${scheduledCount > 1 ? "s" : ""} scheduled for today`
                : "No reminders scheduled for today"}
            </span>
          </div>
        )}

        {permission === "denied" && (
          <p className="text-xs text-muted-foreground">
            To enable notifications, click the lock icon in your browser's address bar and allow notifications for this site.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
