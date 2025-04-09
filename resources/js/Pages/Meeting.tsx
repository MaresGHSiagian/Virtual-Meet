// Meeting.tsx
import { Head, router } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import { useMeeting } from "@videosdk.live/react-sdk";
import {
  AiOutlineAudio, AiOutlineAudioMuted, AiOutlineClose, AiOutlineCopy
} from "react-icons/ai";
import { BsCameraVideo, BsCameraVideoOff } from "react-icons/bs";
import { LuScreenShare, LuScreenShareOff } from "react-icons/lu";
import { HiPhoneMissedCall } from "react-icons/hi";
import { useWebRTC, WebRTCState } from "@/hooks/useWebRTC";
import { PageProps, User } from "@/types";
import { useEffect, useState } from "react";
import Moment from "react-moment";
import { Avatar, useToast } from "@chakra-ui/react";
import SoundWaveCanvas from "@/Components/SoundWaveCanvas";
import RemoteStreamDisplay from "@/Components/RemoteStreamDisplay";
import ChatBox from "@/Components/Chatbox";
import ButtonEnd from "@/Components/ButtonEnd";
import ButtonVideo from "@/Components/ButtonVideo";
import ShareScreenButton from "@/Components/ShareScreenButton";
import ButtonMic from "@/Components/ButtonMic";
import ParticipantView from "@/Components/ParticipantView";
import React from "react";
import UserCameraView from "@/Components/UserCameraView";

interface MeetingProps extends PageProps {
  id: string;
}

export default function Meeting({ auth, id }: MeetingProps) {
  const {
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    setIsScreenSharing,
    createOffer,
    createPeer,
    removePeer,
    createMyVideoStream,
    destroyConnection,
    localStream,
    remoteStreams,
    isToggling,
    toggleMic,
    toggleVideo
  }: WebRTCState = useWebRTC({ meetingCode: id, userId: auth.user.id });

  const toast = useToast();
  const [showInviteModal, setshowInviteModal] = useState(false);
  const [meetingUsers, setMeetingUsers] = useState<User[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const endCall = () => {
    destroyConnection();
    toast({
      title: "Call End.",
      status: "success",
      position: "top-right",
      variant: "left-accent",
      duration: 2000,
      isClosable: true,
    });
    router.visit(`/dashboard`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Copied.",
      status: "success",
      position: "top-right",
      variant: "left-accent",
      duration: 2000,
      isClosable: true,
    });
  };

  useEffect(() => {
    const initializeVideoStream = async () => {
      const stream = await createMyVideoStream(false, false);
      toast({
        title: "Call Started.",
        status: "success",
        position: "top-right",
        variant: "left-accent",
        duration: 2000,
        isClosable: true,
      });

      if (id) {
        (window as any).Echo.join(`meeting.${id}`)
          .here(async (users: User[]) => {
            setMeetingUsers(users);
            users.forEach(async (user) => {
              if (user.id !== auth.user.id) {
                await createPeer(user.id, stream);
              }
            });
          })
          .joining(async (user: User) => {
            setMeetingUsers((prev) => [...prev, user]);
            createOffer(user.id, stream);
          })
          .leaving((user: User) => {
            setMeetingUsers((prev) => prev.filter((u) => u.id !== user.id));
            removePeer(user.id);
          })
          .error((error: any) => {
            console.error({ error });
          });
      }
    };

    initializeVideoStream();

    return () => {
      (window as any).Echo.leave(`meeting.${id}`);
    };
  }, [id]);

  return (
    <div className="relative w-screen h-screen bg-gradient-to-b from-gray-900 via-blue-950 to-green-900">
      <Head title="Meeting" />

      {/* Local username */}
      <div className="absolute text-sm font-bold text-white bottom-20 left-10">
        {auth?.user.name || ""}
      </div>

      {/* Video Grid */}
      <div
        className={`grid h-full grid-cols-1 gap-2 px-10 pt-10 pb-32 sm:grid-cols-2 md:grid-cols-3 ${
          isScreenSharing ? "hidden" : ""
        }`}
      >
        {/* Local Video */}
        <div
  className="relative w-[30rem] h-[18rem] rounded-xl overflow-hidden bg-black"
>
  {/* Of-cam */}
  <div
    className={`absolute inset-0 flex items-center justify-center bg-gray-400 rounded-xl transition-opacity duration-300 ${
      isVideoOff && !isScreenSharing ? "opacity-100 z-10" : "opacity-0 -z-10"
    }`}
  >
    <Avatar className="z-10" name={auth.user.name} size="2xl" />
    {!isAudioMuted && <SoundWaveCanvas mediaStream={localStream} />}
  </div>

  {/* On-cam */}
  <video
    autoPlay
    id={auth.user.id.toString()}
    muted
    className="absolute inset-0 w-full h-full object-cover rounded-xl"
    ref={(videoRef) => {
      if (videoRef && localStream) {
        (videoRef as HTMLVideoElement).srcObject = localStream;
      }
    }}
  ></video>
</div>

        {/* Remote Streams + ParticipantView */}
        {meetingUsers
          .filter((x) => x.id !== auth.user.id)
          .map((user) => (
            <div key={user.id}>
              <RemoteStreamDisplay
                remoteStream={remoteStreams[user.id]}
                name={user.name || "N/A"}
              />
              <ParticipantView participantId={user.id.toString()} />
            </div>
          ))}
      </div>

      {/* Footer Controls */}
      <div
        className={`absolute grid w-screen grid-cols-3 items-center px-10 py-4 text-white bottom-0 ${
          isScreenSharing ? "bg-green bg-opacity-70 backdrop-blur-md" : ""
        }`}
      >
        <div className="flex">
          <div className="mr-1 cursor-not-allowed">
            <Moment className="mr-1" format="h:mm A" /> |
          </div>
          <div>{id}</div>
        </div>

        <div className="space-x-2 text-center">
          <ButtonMic isAudioMuted={isAudioMuted} toggleMic={toggleMic} isToggling={isToggling} />

          <ButtonVideo
            onClick={toggleVideo}
            disabled={isToggling === "video"}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isVideoOff ? (
              <BsCameraVideoOff className="w-5 h-5" />
            ) : (
              <BsCameraVideo className="w-5 h-5" />
            )}
          </ButtonVideo>

          <ShareScreenButton
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            disabled={isToggling === "screen"}
            isScreenSharing={isScreenSharing}
          />

          <ButtonEnd
            onClick={endCall}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <HiPhoneMissedCall className="w-5 h-5" />
          </ButtonEnd>
        </div>

        <div className="flex justify-end">
        <PrimaryButton
  onClick={() => setIsChatOpen(!isChatOpen)}
  className="text-xl px-3 py-2 !bg-blue-400 text-white rounded-lg"
  aria-label={isChatOpen ? "Close Chat" : "Open Chat"} // aksesibilitas
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M11.176 14.429c-2.665 0-4.826-1.8-4.826-4.018 0-2.22 2.159-4.02 4.824-4.02S16 8.191 16 10.411c0 1.21-.65 2.301-1.666 3.036a.32.32 0 0 0-.12.366l.218.81a.6.6 0 0 1 .029.117.166.166 0 0 1-.162.162.2.2 0 0 1-.092-.03l-1.057-.61a.5.5 0 0 0-.256-.074.5.5 0 0 0-.142.021 5.7 5.7 0 0 1-1.576.22" />
    <path d="M0 6.826c0 1.455.781 2.765 2.001 3.656a.385.385 0 0 1 .143.439l-.161.6-.1.373a.5.5 0 0 0-.032.14.19.19 0 0 0 .193.193q.06 0 .111-.029l1.268-.733a.6.6 0 0 1 .308-.088q.088 0 .171.025a6.8 6.8 0 0 0 1.625.26 4.5 4.5 0 0 1-.177-1.251c0-2.936 2.785-5.02 5.824-5.02l.15.002C10.587 3.429 8.392 2 5.796 2 2.596 2 0 4.16 0 6.826m4.632-1.555a.77.77 0 1 1-1.54 0 .77.77 0 0 1 1.54 0m3.875 0a.77.77 0 1 1-1.54 0 .77.77 0 0 1 1.54 0" />
  </svg>
</PrimaryButton>

        </div>

        <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>

      {/* Webcam preview during screen share */}
      {isScreenSharing && (
  <UserCameraView
    isVideoOff={isVideoOff}
    isScreenSharing={isScreenSharing}
    username={auth.user.name}
    localStream={localStream}
  />
)}



 
 {/* Invite Modal */}
      <div
        className={`absolute p-5 bg-white rounded-lg w-80 bottom-20 left-10 ${
          showInviteModal ? "" : "hidden"
        }`}
      >
        <div className="flex justify-between mb-5">
          <h1 className="text-lg font-bold">Your meeting's ready</h1>
          <button onClick={() => setshowInviteModal(false)}>
            <AiOutlineClose />
          </button>
        </div>

        <p className="mb-5 text-sm">
          Share this meeting link with others you want in the meeting
        </p>

        <div className="flex justify-between p-3 mb-5 bg-gray-200 rounded">
          <div className="text-lg">{id}</div>
          <button onClick={handleCopy}>
            <AiOutlineCopy className="cursor-pointer w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
}
