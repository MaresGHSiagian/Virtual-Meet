import React from "react";

interface ButtonEndProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

const ButtonEnd: React.FC<ButtonEndProps> = ({ children, onClick, className }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-white rounded ${className}`}
        >
            {children}
        </button>
    );
};

export default ButtonEnd;
