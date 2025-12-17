import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseWebRTCOptions {
  sessionId: string;
  appointmentId: string;
}

interface SignalingMessage {
  id: string;
  session_id: string;
  sender_id: string;
  message_type: "offer" | "answer" | "ice-candidate" | "join" | "leave";
  payload: any;
  created_at: string;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useWebRTC({ sessionId, appointmentId }: UseWebRTCOptions) {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participantJoined, setParticipantJoined] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isInitiatorRef = useRef(false);

  // Initialize media stream
  const initializeMedia = useCallback(async () => {
    try {
      console.log("Initializing media stream...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      console.log("Local stream initialized:", stream.id);
      return stream;
    } catch (err: any) {
      console.error("Error accessing media devices:", err);
      setError("Unable to access camera or microphone. Please check permissions.");
      throw err;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((stream: MediaStream) => {
    console.log("Creating peer connection...");
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks
    stream.getTracks().forEach((track) => {
      console.log("Adding track:", track.kind);
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      setRemoteStream(event.streams[0]);
      setIsConnected(true);
      setIsConnecting(false);
    };

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && user) {
        console.log("Sending ICE candidate...");
        await supabase.from("signaling_messages").insert({
          session_id: sessionId,
          sender_id: user.id,
          message_type: "ice-candidate",
          payload: event.candidate.toJSON(),
        } as any);
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setIsConnected(false);
        setError("Connection lost. Please try reconnecting.");
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [sessionId, user]);

  // Process pending ICE candidates
  const processPendingCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    console.log(`Processing ${pendingCandidatesRef.current.length} pending candidates`);
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding pending ICE candidate:", err);
      }
    }
    pendingCandidatesRef.current = [];
  }, []);

  // Handle signaling messages
  const handleSignalingMessage = useCallback(
    async (message: SignalingMessage) => {
      if (message.sender_id === user?.id) return;

      const pc = peerConnectionRef.current;
      console.log("Received signaling message:", message.message_type);

      switch (message.message_type) {
        case "join":
          setParticipantJoined(true);
          // If we're already in the call and someone joins, create offer
          if (pc && localStream && !isInitiatorRef.current) {
            isInitiatorRef.current = true;
            setIsConnecting(true);
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await supabase.from("signaling_messages").insert({
                session_id: sessionId,
                sender_id: user!.id,
                message_type: "offer" as const,
                payload: { sdp: offer.sdp, type: offer.type },
              } as any);
            } catch (err) {
              console.error("Error creating offer:", err);
            }
          }
          break;

        case "offer":
          if (pc) {
            setIsConnecting(true);
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
              await processPendingCandidates();
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await supabase.from("signaling_messages").insert({
                session_id: sessionId,
                sender_id: user!.id,
                message_type: "answer" as const,
                payload: { sdp: answer.sdp, type: answer.type },
              } as any);
            } catch (err) {
              console.error("Error handling offer:", err);
            }
          }
          break;

        case "answer":
          if (pc && pc.signalingState === "have-local-offer") {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
              await processPendingCandidates();
            } catch (err) {
              console.error("Error handling answer:", err);
            }
          }
          break;

        case "ice-candidate":
          if (pc) {
            if (pc.remoteDescription) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(message.payload));
              } catch (err) {
                console.error("Error adding ICE candidate:", err);
              }
            } else {
              console.log("Queuing ICE candidate (no remote description yet)");
              pendingCandidatesRef.current.push(message.payload);
            }
          }
          break;

        case "leave":
          setParticipantJoined(false);
          setRemoteStream(null);
          setIsConnected(false);
          break;
      }
    },
    [user, sessionId, localStream, processPendingCandidates]
  );

  // Start the call
  const startCall = useCallback(async () => {
    if (!user) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Initialize media
      const stream = await initializeMedia();

      // Create peer connection
      createPeerConnection(stream);

      // Subscribe to signaling channel
      const channel = supabase
        .channel(`video-call-${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "signaling_messages",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            handleSignalingMessage(payload.new as SignalingMessage);
          }
        )
        .subscribe();

      channelRef.current = channel;

      // Announce joining
      await supabase.from("signaling_messages").insert({
        session_id: sessionId,
        sender_id: user.id,
        message_type: "join",
        payload: { userId: user.id, timestamp: new Date().toISOString() },
      } as any);

      // Check for existing messages (in case other person is already in call)
      const { data: existingMessages } = await supabase
        .from("signaling_messages")
        .select("*")
        .eq("session_id", sessionId)
        .neq("sender_id", user.id)
        .order("created_at", { ascending: true });

      if (existingMessages && existingMessages.length > 0) {
        setParticipantJoined(true);
        for (const msg of existingMessages) {
          await handleSignalingMessage(msg as SignalingMessage);
        }
      } else {
        setIsConnecting(false);
      }
    } catch (err: any) {
      console.error("Error starting call:", err);
      setError(err.message || "Failed to start call");
      setIsConnecting(false);
    }
  }, [user, sessionId, initializeMedia, createPeerConnection, handleSignalingMessage]);

  // End the call
  const endCall = useCallback(async () => {
    console.log("Ending call...");

    // Send leave message
    if (user && sessionId) {
      await supabase.from("signaling_messages").insert({
        session_id: sessionId,
        sender_id: user.id,
        message_type: "leave",
        payload: { userId: user.id },
      } as any);
    }

    // Clean up peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clean up media streams
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Unsubscribe from channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
    setParticipantJoined(false);
  }, [user, sessionId, localStream]);

  // Toggle audio
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return {
    localStream,
    remoteStream,
    isConnected,
    isConnecting,
    error,
    isMuted,
    isVideoOff,
    participantJoined,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}
