import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({ className = '', disabled, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
        {...props}
        className={
            `inline-flex items-center px-6 py-2 
            bg-white/70 border border-transparent 
            rounded-md font-semibold text-sm text-black 
            hover:text-blue-600 hover:bg-white/90 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
            transition ease-in-out duration-150 ${
                disabled && 'opacity-25 cursor-not-allowed'
            } ` + className
        }
        disabled={disabled}
    >
        {children}
    </button>
    
    );
}
