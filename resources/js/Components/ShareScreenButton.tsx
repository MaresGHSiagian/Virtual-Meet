import { LuScreenShare, LuScreenShareOff } from "react-icons/lu";

interface ShareScreenButtonProps {
    onClick: () => void;
    disabled: boolean;
    isScreenSharing: boolean;
}

export default function ShareScreenButton({ onClick, disabled, isScreenSharing }: ShareScreenButtonProps) {
    return (
        <button 
            onClick={onClick} 
            disabled={disabled} 
            className="p-2 px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white"
        >
            {isScreenSharing ? <LuScreenShareOff className="w-5 h-5" /> : <LuScreenShare className="w-5 h-5" />}
        </button>
    );
}
