import React from "react";

interface ButtonVideoProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

const ButtonVideo: React.FC<ButtonVideoProps> = ({ children, onClick, disabled, className }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 text-white rounded transition-all duration-300 ${
                disabled ? "bg-gray-400 cursor-not-allowed" : className
            }`}
        >
            {children}
        </button>
    );
};

export default ButtonVideo;
