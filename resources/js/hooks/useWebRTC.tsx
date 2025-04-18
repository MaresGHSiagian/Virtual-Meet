import axios from 'axios';
import { useEffect, useRef, useState } from 'react';


const servers = {
    iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
    ],
};



export interface WebRTCState {
    isAudioMuted: boolean;
    isVideoOff: boolean;
    isScreenSharing: boolean;
    setIsScreenSharing: React.Dispatch<React.SetStateAction<boolean>>;
    createOffer: (targetId: number, stream?: MediaStream) => void;
    removePeer: (targetId: number) => void;
    createPeer: (targetId: number, stream?: MediaStream) => Promise<RTCPeerConnection>;
    createMyVideoStream: (video: boolean, audio: boolean) => Promise<MediaStream>
    destroyConnection: () => Promise<void>;
    localStream: MediaStream;
    remoteStreams: Record<number, MediaStream>;
    isToggling: string | null
    toggleMic: () => void;
    toggleVideo: () => void;
}

export function useWebRTC({ meetingCode, userId }: { meetingCode: string, userId: number }): WebRTCState {
    const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
    const [isVideoOff, setIsVideoOff] = useState<boolean>(true);
    const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
    const [isToggling, setIsToggling] = useState<string | null>(null);

    const peersRef = useRef<Record<number, RTCPeerConnection>>([]);
    const renegotiatingRef = useRef(false);

    const [localStream, setLocalStream] = useState<MediaStream>(new MediaStream());
    const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>({});
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);


    const createStream = async ({ audio, video }: { audio: boolean, video: boolean }) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
            return stream;
        } catch (error) {
            return new MediaStream();
        }
    }
    const createMyVideoStream = async (
        video: boolean,
        audio: boolean,
        setCameraStream?: React.Dispatch<React.SetStateAction<MediaStream | null>>
      ): Promise<MediaStream> => {
        try {
          const stream = await createStream({ video, audio });
      
          setIsAudioMuted(!stream.getAudioTracks()[0]?.enabled);
          setIsVideoOff(!stream.getVideoTracks()[0]?.enabled);
          setLocalStream(stream);
      
          // Jika ada kamera stream yang ingin disimpan terpisah (untuk ditampilkan saat share screen)
          if (setCameraStream && stream.getVideoTracks().length > 0) {
            const camStream = new MediaStream([stream.getVideoTracks()[0]]);
            setCameraStream(camStream);
          }
      
          return stream;
        } catch (error) {
          const emptyStream = new MediaStream();
          setIsAudioMuted(true);
          setIsVideoOff(true);
          setLocalStream(emptyStream);
          console.error("Error accessing camera and microphone:", error);
          return emptyStream;
        }
      };
        //   MENGAMBIL STOPSCREEN OF SEMUA
    const destroyConnection = async () => {
        localStream?.getTracks().forEach(track => track.stop());

           if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
        }
        Object.values(remoteStreams).forEach((stream) => {
            stream.getTracks().forEach(track => track.stop());
        });

        const cleanupPromises = Object.keys(peersRef.current).map(async (targetId) => {
            return new Promise<void>((resolve) => {
                const peer = peersRef.current[parseInt(targetId)];
                if (peer) {
                    peer.ontrack = null;
                    peer.onicecandidate = null;
                    peer.onsignalingstatechange = null;
                    peer.onconnectionstatechange = null;

                    peer.close();
                    delete peersRef.current[parseInt(targetId)];
                    console.log("DESTROY " + targetId);
                    resolve();
                }
            });
        });

        await Promise.all(cleanupPromises);
        peersRef.current = [];
        console.log("All connections destroyed");
    }


    const createPeer = async (targetId: number, stream?: MediaStream): Promise<RTCPeerConnection> => {
        const peer = new RTCPeerConnection(servers);

        if (stream) {
            stream.getTracks().forEach(track => {
                peer.addTrack(track, stream);
            })

        }

        peer.onicecandidate = (event) => {
            if (!event?.candidate) return;
            if (peer.iceConnectionState == 'connected') return;

            (window as any).Echo.join(`handshake.${meetingCode}`)
                .whisper('negotiation', {
                    data: JSON.stringify({
                        type: 'candidate',
                        data: event.candidate
                    }),
                    sender_id: userId,
                    reciver_id: targetId
                })
        };

        peer.ontrack = async (event) => {
            const remoteStream = event.streams[0];
            setRemoteStreams(prevStreams => ({
                ...prevStreams,
                [targetId]: remoteStream
            }));
        }



        peer.onsignalingstatechange = () => {
            console.log(`${targetId} : signalingState ${peer.signalingState}`);
        };

        peer.onconnectionstatechange = () => {
            console.log(`${targetId} : iceConnectionState ${peer.iceConnectionState}`);

            if (peer.iceConnectionState === 'disconnected' ||
                peer.iceConnectionState === 'failed' ||
                peer.iceConnectionState === 'closed') {
                reNegotiation(targetId);
            }
        };

        peer.oniceconnectionstatechange = () => {
            if (peer.iceConnectionState === "failed") {
                peer.restartIce();
            }
        }

        peersRef.current[targetId] = peer;
        return peer;
    }

    const removePeer = (targetId: number) => {
        const peer = peersRef.current[targetId];
        if (!peer) return console.error(`${targetId} : removePeer no peer found.`)
        peer.ontrack = null;
        peer.onicecandidate = null;
        peer.onsignalingstatechange = null;
        peer.onconnectionstatechange = null;

        peer.close();
        delete peersRef.current[targetId];
        const emptyStream = new MediaStream();
        setRemoteStreams(prevStreams => ({
            ...prevStreams,
            [targetId]: emptyStream,
        }));

        console.log("DESTROY " + targetId);
    }

    const createOffer = async (targetId: number, stream?: MediaStream) => {

        let peer = peersRef.current[targetId];
        if (!peer) {
            peer = await createPeer(targetId, stream);
        }
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        (window as any).Echo.join(`handshake.${meetingCode}`)
            .whisper('negotiation', {
                data: JSON.stringify(offer),
                sender_id: userId,
                reciver_id: targetId
            })
    }




    const handleIncomingOffer = async (sender_id: number, offer: RTCSessionDescriptionInit) => {
        let peer = peersRef.current[sender_id];
        if (!peer) {
          peer = await createPeer(sender_id, localStream); // atau stream yang aktif
        }
        
        if (peer.signalingState !== 'stable') return;

        await peer.setRemoteDescription(offer);

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        (window as any).Echo.join(`handshake.${meetingCode}`)
            .whisper('negotiation', {
                data: JSON.stringify(answer),
                sender_id: userId,
                reciver_id: sender_id
            })
    }

    const handleIncomingAnswer = async (sender_id: number, answer: RTCSessionDescriptionInit) => {
        const peer = peersRef.current[sender_id];
        if (!peer) return console.error(`${sender_id} : handleIncomingAnswer no peer found.`);
        await peer.setRemoteDescription(answer);
    }

    const handleIncomingCandidate = async (sender_id: number, candidate: RTCIceCandidate) => {
        const peer = peersRef.current[sender_id];
        if (!peer) return console.error(`${sender_id} : handleIncomingCandidate no peer found.`);
        if (!candidate) return console.log(`${sender_id} : handleIncomingCandidate candidate null.`);
        if (peer.iceConnectionState === 'connected') return
        await peer.addIceCandidate(candidate);
    }

    const reNegotiation = async (targetId: number) => {
        if (renegotiatingRef.current) return;

        // Set renegotiatingRef to true to avoid multiple re-negotiation attempts
        renegotiatingRef.current = true;

        let peer = peersRef.current[targetId];

        const offer = await peer.createOffer({ iceRestart: true });
        await peer.setLocalDescription(offer);

        (window as any).Echo.join(`handshake.${meetingCode}`)
            .whisper('negotiation', {
                data: JSON.stringify(offer),
                sender_id: userId,
                reciver_id: targetId
            })

        renegotiatingRef.current = false;
    }

    const replaceRemotesStream = (newStream: MediaStream | null, audioEnabled: boolean, videoEnabled: boolean) => {
        Object.keys(peersRef.current).forEach(async targetId => {
            const peer = peersRef.current[parseInt(targetId)];

            if (newStream) {
                newStream.getTracks().forEach(track => {
                    peer.addTrack(track, newStream);
                })
            } else {
                peer.getSenders().forEach(sender => {
                    if (sender.track && (sender.track.kind === 'audio' || sender.track.kind === 'video')) {
                        peer.removeTrack(sender);
                    }
                });
            }

            reNegotiation(parseInt(targetId));
        });
    }

    // shareScreen
    const shareScreen = async () => {
        try {
            if (
                typeof navigator === "undefined" ||
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getDisplayMedia
            ) {
                console.error("getDisplayMedia tidak tersedia di environment ini.");
                alert("Fitur share screen tidak didukung di browser ini.");
                setIsScreenSharing(false);
                return;
            }
    
            setIsScreenSharing(true);
    
            // 1. Ambil stream dari layar
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            setScreenStream(screenStream); // ✅ simpan di state
            const screenVideoTrack = screenStream.getVideoTracks()[0];
    
            // 2. Tambahkan screen track ke semua peer
            Object.entries(peersRef.current).forEach(([targetId, peer]) => {
                if (peer && screenVideoTrack) {
                    peer.addTrack(screenVideoTrack, screenStream);
                    reNegotiation(parseInt(targetId)); // 🔥 tambahkan ini
                }
            });
    
            // 3. Saat user stop sharing screen (dari UI browser)
            screenVideoTrack.onended = async () => {
                try {
                    screenVideoTrack.stop();
                } catch (e) {
                    console.warn("Gagal stop screen track:", e);
                }
            
                setIsScreenSharing(false);
            
                // ✅ DETEKSI APAKAH KAMERA SEBELUMNYA AKTIF
                const cameraTrack = localStream.getVideoTracks().find(track => track.label.toLowerCase().includes("camera"));
                const shouldTurnOnCamera = !!cameraTrack;

            
                // Stop video track yang mungkin tertinggal (share screen track)
                const existingVideoTrack = localStream.getVideoTracks()[0];
                if (existingVideoTrack) {
                    localStream.removeTrack(existingVideoTrack);
                    existingVideoTrack.stop(); // Benar-benar matikan device kamera
                }
            
                // ✅ Buat ulang stream sesuai kondisi sebelumnya
                const newStream = await createStream({
                    video: shouldTurnOnCamera,
                    audio: !isAudioMuted
                });
            
                if (!newStream) {
                    console.log("Tidak bisa membuat ulang stream setelah screen sharing.");
                    return;
                }
            
                setLocalStream(newStream);
                setIsVideoOff(!shouldTurnOnCamera);
                replaceRemotesStream(newStream, !isAudioMuted, shouldTurnOnCamera);
            };
            
    
        } catch (error) {
            console.error("Terjadi kesalahan saat berbagi layar:", error);
            alert("Gagal memulai screen sharing. Coba lagi atau cek browser kamu.");
            setIsScreenSharing(false);
        }
    };

    

    const toggleMic = async () => {
        if (isToggling == 'audio') return;
        if (isVideoOff && !isAudioMuted) {
            localStream.getTracks().forEach(track => track.stop());
            replaceRemotesStream(null, false, false);
            setLocalStream(new MediaStream());
            setIsToggling(null);
            setIsAudioMuted(prevValue => !prevValue);
            return;
        }

        setIsToggling('audio');

        localStream.getTracks().forEach(track => track.stop());
        const newStream = await createStream({ audio: isAudioMuted, video: !isVideoOff });
        if (!newStream) return console.log("newStream not found on toggle mic")
        setLocalStream(newStream);
        replaceRemotesStream(newStream, isAudioMuted, !isVideoOff);

        setIsAudioMuted(prevValue => !prevValue);
        setIsToggling(null);
    };


    const toggleVideo = async () => {
        if (isToggling === 'video') return;

        setIsToggling('video');

        if (isAudioMuted && !isVideoOff) {
            localStream.getTracks().forEach(track => track.stop());
            replaceRemotesStream(null, false, false);
            setLocalStream(new MediaStream());
            setIsToggling(null);
            setIsVideoOff(prevValue => !prevValue);
            return;
        }

        localStream.getTracks().forEach(track => track.stop());

        const newStream = await createStream({ video: isVideoOff, audio: !isAudioMuted });
        if (!newStream) return console.log("newStream not found on toggle Video")

        setLocalStream(newStream);
        replaceRemotesStream(newStream, !isAudioMuted, isVideoOff);

        setIsVideoOff(prevValue => !prevValue);
        setIsToggling(null);
    };



    useEffect(() => {
        if (meetingCode) {
            (window as any).Echo.join(`handshake.${meetingCode}`)
                .listenForWhisper("negotiation", async ({ sender_id, reciver_id, data }: { sender_id: number, reciver_id: number, data: string }) => {
                    if (reciver_id != userId) return;

                    try {
                        const JSON_DATA = JSON.parse(data);
                        console.log(JSON_DATA.type);

                        if (JSON_DATA.type === 'offer') {
                            handleIncomingOffer(sender_id, JSON_DATA);
                        }

                        if (JSON_DATA.type === 'answer') {
                            handleIncomingAnswer(sender_id, JSON_DATA);
                        }

                        if (JSON_DATA.type === 'candidate') {
                            handleIncomingCandidate(sender_id, JSON_DATA.data);
                        }

                    } catch (error) {
                        console.error('handshake:error', error);
                    }
                })
        }

        return () => {
            (window as any).Echo.leave(`handshake.${meetingCode}`);
        }
    }, [meetingCode, peersRef]);



    useEffect(() => {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !isAudioMuted;
        }
    }, [isAudioMuted]);


    useEffect(() => {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !isVideoOff;
        }
    }, [isVideoOff]);


    useEffect(() => {
        if (isScreenSharing) {
            shareScreen();
        }
    }, [isScreenSharing]);


    return {
        isAudioMuted,
        isVideoOff,
        isScreenSharing,
        setIsScreenSharing,
        createPeer,
        removePeer,
        createOffer,
        createMyVideoStream,
        destroyConnection,
        localStream,
        remoteStreams,
        isToggling,
        toggleMic,
        toggleVideo
    }
}
