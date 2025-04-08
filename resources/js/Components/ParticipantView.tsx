// ParticipantView.tsx
import React, { useMemo } from "react";
import { useParticipant } from "@videosdk.live/react-sdk";
import ReactPlayer from "react-player";

interface ParticipantViewProps {
  participantId: string;
  isScreenShare?: boolean;
  isThumbnail?: boolean;
}

export default function ParticipantView({
  participantId,
  isScreenShare = false,
  isThumbnail = false,
}: ParticipantViewProps) {
  const { webcamStream, screenShareStream, webcamOn, screenShareOn } = useParticipant(participantId);

  const mediaStream = useMemo(() => {
    const stream = new MediaStream();
    if (isScreenShare && screenShareOn && screenShareStream) {
      stream.addTrack(screenShareStream.track);
    } else if (webcamOn && webcamStream) {
      stream.addTrack(webcamStream.track);
    }
    return stream;
  }, [isScreenShare, screenShareOn, screenShareStream, webcamOn, webcamStream]);

  if (!mediaStream) return null;

  return (
    <ReactPlayer
      playing
      muted
      height={isThumbnail ? "120px" : "100%"}
      width={isThumbnail ? "100%" : "100%"}
      url={mediaStream}
    />
  );
}
