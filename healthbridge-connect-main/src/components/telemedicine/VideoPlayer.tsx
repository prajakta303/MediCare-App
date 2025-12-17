import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { User, VideoOff } from "lucide-react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  isLocal?: boolean;
  isVideoOff?: boolean;
  label?: string;
  className?: string;
}

export function VideoPlayer({
  stream,
  muted = false,
  isLocal = false,
  isVideoOff = false,
  label,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-muted",
        className
      )}
    >
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={cn(
            "w-full h-full object-cover",
            isLocal && "transform scale-x-[-1]"
          )}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          {isVideoOff ? (
            <div className="flex flex-col items-center gap-2">
              <VideoOff className="w-12 h-12 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Video Off</span>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-12 h-12 text-primary" />
            </div>
          )}
        </div>
      )}

      {label && (
        <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm">
          <span className="text-sm font-medium">{label}</span>
        </div>
      )}
    </div>
  );
}
