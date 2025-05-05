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
    const [isAudioMuted, setIsAudioMuted] = useState(true);
    const [isVideoOff, setIsVideoOff] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isToggling, setIsToggling] = useState<string | null>(null);

    const [shouldVideoBeOffAfterScreenShare, setShouldVideoBeOffAfterScreenShare] = useState(false); // <--- Tambah state

    const peersRef = useRef<Record<number, RTCPeerConnection>>({});
    const renegotiatingRef = useRef(false);

    const [localStream, setLocalStream] = useState<MediaStream>(new MediaStream());
    const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>({});
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

    // Create media stream
    const createStream = async ({ audio, video }: { audio: boolean, video: boolean }) => {
        try {
            return await navigator.mediaDevices.getUserMedia({ audio, video });
        } catch {
            return new MediaStream();
        }
    };

    // Create local video stream
    const createMyVideoStream = async (
        video: boolean,
        audio: boolean,
        setCameraStream?: React.Dispatch<React.SetStateAction<MediaStream | null>>
    ): Promise<MediaStream> => {
        try {
            const stream = await createStream({ video, audio });
            // Jika video=false, pastikan tidak ada video track
            if (!video) {
                stream.getVideoTracks().forEach(track => {
                    track.stop();
                    stream.removeTrack(track);
                });
            }
            setIsAudioMuted(!stream.getAudioTracks()[0]?.enabled);
            setIsVideoOff(!stream.getVideoTracks()[0]?.enabled || !video);
            setLocalStream(stream);
            if (setCameraStream && stream.getVideoTracks().length > 0) {
                setCameraStream(new MediaStream([stream.getVideoTracks()[0]]));
            } else if (setCameraStream) {
                setCameraStream(null);
            }
            return stream;
        } catch (error) {
            setIsAudioMuted(true);
            setIsVideoOff(true);
            setLocalStream(new MediaStream());
            console.error("Error accessing camera and microphone:", error);
            return new MediaStream();
        }
    };

    // Destroy all connections and streams
    const destroyConnection = async () => {
        // Stop and remove all tracks from localStream
        localStream?.getTracks().forEach(track => {
            track.stop();
            localStream.removeTrack(track);
        });
        setLocalStream(new MediaStream());

        // Stop and remove all tracks from screenStream
        if (screenStream) {
            screenStream.getTracks().forEach(track => {
                track.stop();
                screenStream.removeTrack(track);
            });
            setScreenStream(null);
        }

        // Stop and remove all tracks from each remote stream
        Object.values(remoteStreams).forEach(stream => {
            stream.getTracks().forEach(track => {
                track.stop();
                stream.removeTrack(track);
            });
        });
        setRemoteStreams({});

        // Close and remove all peers
        await Promise.all(Object.keys(peersRef.current).map(async targetId => {
            const peer = peersRef.current[parseInt(targetId)];
            if (peer) {
                peer.ontrack = null;
                peer.onicecandidate = null;
                peer.onsignalingstatechange = null;
                peer.onconnectionstatechange = null;
                peer.close();
                delete peersRef.current[parseInt(targetId)];
            }
        }));
        peersRef.current = {};

        // Reset all state
        setIsAudioMuted(true);
        setIsVideoOff(true);
        setIsScreenSharing(false);
        setIsToggling(null);
        setShouldVideoBeOffAfterScreenShare(false);
    };

    // Create peer connection
    const createPeer = async (targetId: number, stream?: MediaStream): Promise<RTCPeerConnection> => {
        const peer = new RTCPeerConnection(servers);
        if (stream) stream.getTracks().forEach(track => peer.addTrack(track, stream));
        peer.onicecandidate = event => {
            if (!event?.candidate) return;
            (window as any).Echo.join(`handshake.${meetingCode}`)
                .whisper('negotiation', {
                    data: JSON.stringify({ type: 'candidate', data: event.candidate }),
                    sender_id: userId,
                    reciver_id: targetId
                });
        };
        peer.ontrack = event => {
            setRemoteStreams(prev => ({ ...prev, [targetId]: event.streams[0] }));
        };
        peer.onsignalingstatechange = () => {};
        peer.onconnectionstatechange = () => {
            if (["disconnected", "failed", "closed"].includes(peer.iceConnectionState)) {
                reNegotiation(targetId);
            }
        };
        peer.oniceconnectionstatechange = () => {
            if (peer.iceConnectionState === "failed") peer.restartIce();
        };
        peersRef.current[targetId] = peer;
        return peer;
    };

    // Remove peer
    const removePeer = (targetId: number) => {
        const peer = peersRef.current[targetId];
        if (!peer) return;
        peer.ontrack = null;
        peer.onicecandidate = null;
        peer.onsignalingstatechange = null;
        peer.onconnectionstatechange = null;
        peer.close();
        delete peersRef.current[targetId];
        setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[targetId];
            return newStreams;
        });
    };

    // Create offer
    const createOffer = async (targetId: number, stream?: MediaStream) => {
        let peer = peersRef.current[targetId];
        if (!peer) peer = await createPeer(targetId, stream);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        (window as any).Echo.join(`handshake.${meetingCode}`)
            .whisper('negotiation', {
                data: JSON.stringify(offer),
                sender_id: userId,
                reciver_id: targetId
            });
    };

    // Handle incoming offer
    const handleIncomingOffer = async (sender_id: number, offer: RTCSessionDescriptionInit) => {
        let peer = peersRef.current[sender_id];
        if (!peer) peer = await createPeer(sender_id, localStream);
        if (peer.signalingState !== 'stable') return;
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        (window as any).Echo.join(`handshake.${meetingCode}`)
            .whisper('negotiation', {
                data: JSON.stringify(answer),
                sender_id: userId,
                reciver_id: sender_id
            });
    };

    // Handle incoming answer
    const handleIncomingAnswer = async (sender_id: number, answer: RTCSessionDescriptionInit) => {
        const peer = peersRef.current[sender_id];
        if (!peer) return;
        await peer.setRemoteDescription(answer);
    };

    // Handle incoming candidate
    const handleIncomingCandidate = async (sender_id: number, candidate: RTCIceCandidate) => {
        const peer = peersRef.current[sender_id];
        if (!peer || !candidate) return;
        if (peer.iceConnectionState === 'connected') return;
        await peer.addIceCandidate(candidate);
    };

    // Renegotiation
    const reNegotiation = async (targetId: number) => {
        if (renegotiatingRef.current) return;
        renegotiatingRef.current = true;
        const peer = peersRef.current[targetId];
        const offer = await peer.createOffer({ iceRestart: true });
        await peer.setLocalDescription(offer);
        (window as any).Echo.join(`handshake.${meetingCode}`)
            .whisper('negotiation', {
                data: JSON.stringify(offer),
                sender_id: userId,
                reciver_id: targetId
            });
        renegotiatingRef.current = false;
    };

    // Replace remote streams (optimized: use replaceTrack if possible)
    const replaceRemotesStream = (newStream: MediaStream | null, audioEnabled: boolean, videoEnabled: boolean) => {
        Object.keys(peersRef.current).forEach(targetIdStr => {
            const targetId = parseInt(targetIdStr);
            const peer = peersRef.current[targetId];
            if (!peer) return;
            const senders = peer.getSenders();

            if (newStream) {
                // Replace or add tracks
                ['audio', 'video'].forEach(kind => {
                    const newTrack = newStream.getTracks().find(t => t.kind === kind);
                    const sender = senders.find(s => s.track && s.track.kind === kind);
                    if (sender && newTrack) {
                        if (sender.track !== newTrack) sender.replaceTrack(newTrack);
                    } else if (newTrack) {
                        peer.addTrack(newTrack, newStream);
                    } else if (sender && !newTrack) {
                        peer.removeTrack(sender);
                    }
                });
            } else {
                // Remove all audio/video tracks
                senders.forEach(sender => {
                    if (sender.track && (sender.track.kind === 'audio' || sender.track.kind === 'video')) {
                        peer.removeTrack(sender);
                    }
                });
            }
            reNegotiation(targetId);
        });
    };

    // Share screen (optimized: remove old video track before add new)
    const shareScreen = async () => {
        try {
            if (
                typeof navigator === "undefined" ||
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getDisplayMedia
            ) {
                alert("Fitur share screen tidak didukung di browser ini.");
                setIsScreenSharing(false);
                return;
            }
            const wasVideoOff = isVideoOff;
            setShouldVideoBeOffAfterScreenShare(wasVideoOff);
            setIsScreenSharing(true);

            if (wasVideoOff) {
                localStream.getVideoTracks().forEach(track => {
                    track.stop();
                    localStream.removeTrack(track);
                });
                setLocalStream(new MediaStream(localStream.getAudioTracks()));
                replaceRemotesStream(new MediaStream(localStream.getAudioTracks()), !isAudioMuted, false);
            }

            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            setScreenStream(screenStream);
            const screenVideoTrack = screenStream.getVideoTracks()[0];

            Object.entries(peersRef.current).forEach(([targetId, peer]) => {
                peer.getSenders().forEach(sender => {
                    if (sender.track && sender.track.kind === 'video') {
                        peer.removeTrack(sender);
                    }
                });
                if (peer && screenVideoTrack) {
                    peer.addTrack(screenVideoTrack, screenStream);
                    reNegotiation(parseInt(targetId));
                }
            });

            screenVideoTrack.onended = async () => {
                try { screenVideoTrack.stop(); } catch {}
                setIsScreenSharing(false);
                if (shouldVideoBeOffAfterScreenShare) {
                    // Kamera sebelumnya off, pastikan benar-benar tidak ada video track
                    const audioTracks = localStream.getAudioTracks();
                    const newStream = new MediaStream();
                    audioTracks.forEach(track => newStream.addTrack(track));
                    // Hapus video track jika ada (antisipasi bug browser)
                    newStream.getVideoTracks().forEach(track => {
                        track.stop();
                        newStream.removeTrack(track);
                    });
                    setLocalStream(newStream);
                    setIsVideoOff(true);
                    replaceRemotesStream(newStream, !isAudioMuted, false);
                } else {
                    // Kamera sebelumnya on, hidupkan kembali kamera
                    const newStream = await createStream({
                        video: true,
                        audio: !isAudioMuted
                    });
                    setLocalStream(newStream);
                    setIsVideoOff(false);
                    replaceRemotesStream(newStream, !isAudioMuted, true);
                }
            };
        } catch (error) {
            alert("Gagal memulai screen sharing. Coba lagi atau cek browser kamu.");
            setIsScreenSharing(false);
        }
    };

    // Toggle mic (benar-benar matikan mic dengan menghapus semua audio track)
    const toggleMic = async () => {
        if (isToggling === 'audio') return;
        setIsToggling('audio');
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack && !isAudioMuted) {
            // Matikan mic: stop dan hapus semua audio track dari localStream
            localStream.getAudioTracks().forEach(track => {
                track.stop();
                localStream.removeTrack(track);
            });
            // Buat stream baru hanya dengan video track (jika ada)
            const videoTracks = localStream.getVideoTracks();
            const newStream = new MediaStream();
            videoTracks.forEach(track => newStream.addTrack(track));
            setLocalStream(newStream);
            setIsAudioMuted(true);
            replaceRemotesStream(newStream, false, !isVideoOff);
            setIsToggling(null);
            return;
        }
        // Jika ingin menyalakan mic
        if (isAudioMuted) {
            const newStream = await createStream({ audio: true, video: !isVideoOff });
            if (!newStream) {
                setIsToggling(null);
                return;
            }
            // Jika video sedang off, hapus semua video track dari stream baru
            if (isVideoOff) {
                newStream.getVideoTracks().forEach(track => {
                    track.stop();
                    newStream.removeTrack(track);
                });
            }
            setLocalStream(newStream);
            setIsAudioMuted(false);
            replaceRemotesStream(newStream, true, !isVideoOff);
        }
        setIsToggling(null);
    };

    // Toggle video (benar-benar matikan kamera dengan menghapus semua video track)
    const toggleVideo = async () => {
        if (isToggling === 'video') return;
        setIsToggling('video');

        // Jika kamera sedang ON, matikan total (stop & remove semua video track)
        if (!isVideoOff && localStream.getVideoTracks().length > 0) {
            localStream.getVideoTracks().forEach(track => {
                track.stop();
                localStream.removeTrack(track);
            });
            // Buat stream baru hanya dengan audio track (jika ada)
            const audioTracks = localStream.getAudioTracks();
            const newStream = new MediaStream();
            audioTracks.forEach(track => newStream.addTrack(track));
            setLocalStream(newStream);
            setIsVideoOff(true);
            replaceRemotesStream(newStream, !isAudioMuted, false);
            setIsToggling(null);
            return;
        }

        // Jika kamera sedang OFF, hidupkan kembali
        if (isVideoOff) {
            const newStream = await createStream({ video: true, audio: !isAudioMuted });
            if (!newStream) {
                setIsToggling(null);
                return;
            }
            // Jika mic sedang mute, hapus semua audio track dari stream baru
            if (isAudioMuted) {
                newStream.getAudioTracks().forEach(track => {
                    track.stop();
                    newStream.removeTrack(track);
                });
            }
            setLocalStream(newStream);
            setIsVideoOff(false);
            replaceRemotesStream(newStream, !isAudioMuted, true);
        }
        setIsToggling(null);
    };

    // Negotiation event listener
    useEffect(() => {
        if (meetingCode) {
            (window as any).Echo.join(`handshake.${meetingCode}`)
                .listenForWhisper("negotiation", async ({ sender_id, reciver_id, data }: { sender_id: number, reciver_id: number, data: string }) => {
                    if (reciver_id !== userId) return;
                    try {
                        const JSON_DATA = JSON.parse(data);
                        if (JSON_DATA.type === 'offer') handleIncomingOffer(sender_id, JSON_DATA);
                        if (JSON_DATA.type === 'answer') handleIncomingAnswer(sender_id, JSON_DATA);
                        if (JSON_DATA.type === 'candidate') handleIncomingCandidate(sender_id, JSON_DATA.data);
                    } catch (error) {
                        console.error('handshake:error', error);
                    }
                });
        }
        return () => {
            (window as any).Echo.leave(`handshake.${meetingCode}`);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meetingCode]); // peersRef tidak perlu di dependency

    // Sync audio track enabled state
    useEffect(() => {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = !isAudioMuted;
    }, [isAudioMuted, localStream]);

    // Sync video track enabled state
    useEffect(() => {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = !isVideoOff;
    }, [isVideoOff, localStream]);

    // Start screen sharing if enabled
    useEffect(() => {
        if (isScreenSharing) shareScreen();
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
    };
}
