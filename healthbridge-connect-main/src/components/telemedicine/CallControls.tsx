import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CallControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onStartCall: () => void;
  hasLocalStream: boolean;
}

export function CallControls({
  isConnected,
  isConnecting,
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  onStartCall,
  hasLocalStream,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {hasLocalStream ? (
        <>
          <Button
            variant="outline"
            size="lg"
            className={cn(
              "w-14 h-14 rounded-full",
              isMuted && "bg-destructive/10 border-destructive text-destructive"
            )}
            onClick={onToggleMute}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className={cn(
              "w-14 h-14 rounded-full",
              isVideoOff && "bg-destructive/10 border-destructive text-destructive"
            )}
            onClick={onToggleVideo}
          >
            {isVideoOff ? (
              <VideoOff className="w-6 h-6" />
            ) : (
              <Video className="w-6 h-6" />
            )}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            className="w-14 h-14 rounded-full"
            onClick={onEndCall}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </>
      ) : (
        <Button
          variant="hero"
          size="lg"
          className="px-8"
          onClick={onStartCall}
          disabled={isConnecting}
        >
          <Phone className="w-5 h-5 mr-2" />
          {isConnecting ? "Connecting..." : "Join Call"}
        </Button>
      )}
    </div>
  );
}
