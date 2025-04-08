import { useEffect, useRef, useState } from "react";

interface UserCameraViewProps {
  isVideoOff: boolean;
  isScreenSharing: boolean;
  username: string;
  localStream: MediaStream | null;
}

const getInitials = (name: string) => {
  const words = name.trim().split(" ");
  const initials = words.length >= 2 ? words[0][0] + words[1][0] : words[0][0];
  return initials.toUpperCase();
};

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 60%)`;
  return color;
};

const UserCameraView = ({
  isVideoOff,
  isScreenSharing,
  username,
  localStream,
}: UserCameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: 20, y: 20 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      if (isScreenSharing && localStream && !isVideoOff) {
        const cameraTrack = localStream.getVideoTracks()[0];
        if (cameraTrack) {
          const stream = new MediaStream([cameraTrack]);
          videoEl.srcObject = stream;
        }
      } else {
        videoEl.srcObject = null;
      }
    }
  }, [isScreenSharing, isVideoOff, localStream]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPosition({
        x: Math.min(window.innerWidth - 256, Math.max(0, e.clientX - offset.current.x)), // clamp
        y: Math.min(window.innerHeight - 160, Math.max(0, e.clientY - offset.current.y)), // clamp
      });
    };

    const handleMouseUp = () => {
      dragging.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    dragging.current = true;
    const rect = cameraRef.current?.getBoundingClientRect();
    if (rect) {
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  if (!isScreenSharing || !localStream) return null;

  return (
    <div
      ref={cameraRef}
      onMouseDown={handleMouseDown}
      style={{
        left: position.x,
        top: position.y,
      }}
      className="fixed w-64 h-40 rounded-xl overflow-hidden border border-cyan-400/30 shadow-[0_0_25px_#22d3ee] bg-gradient-to-tr from-gray-900 via-cyan-900 to-green-900 z-50 cursor-move transition-all"
    >
      {!isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-md"
            style={{ backgroundColor: stringToColor(username) }}
          >
            <span className="text-2xl font-semibold text-white uppercase">
              {getInitials(username)}
            </span>
          </div>
        </div>
      )}
      <div className="absolute bottom-1 left-1 right-1 px-1 py-1 bg-green bg-opacity-60 text-white text-sm rounded text-left truncate">
        {username}
      </div>
    </div>
  );
};

export default UserCameraView;
