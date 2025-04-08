import React from "react";
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";


interface ButtonMicProps {
    isAudioMuted: boolean;
    toggleMic: () => void;
    isToggling: string | null;
}

const ButtonMic: React.FC<ButtonMicProps> = ({ isAudioMuted, toggleMic, isToggling }) => {
    return (
        <button
            onClick={toggleMic}
            disabled={isToggling === "audio"}
            className={`px-4 py-2 text-white rounded transition-all duration-300
                ${isAudioMuted ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                ${isToggling === "audio" ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            {isAudioMuted ? (
                <AiOutlineAudioMuted className="w-5 h-5" />
            ) : (
                <AiOutlineAudio className="w-5 h-5" />
            )}
        </button>
    );
};

export default ButtonMic;
