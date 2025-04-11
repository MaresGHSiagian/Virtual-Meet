import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 overflow-hidden">
            {/* Background SVG */}
            <div className="absolute inset-0 -z-10 flex justify-center items-center">
                <img
                    src="/asset/Login.svg"
                    alt="Login Illustration"
                    className="w-full max-w-1xl h-auto object-cover opacity-90"
                />
            </div>

            <div>
                <Link href="/">
                    <ApplicationLogo className="w-20 h-20 fill-current text-gray-500" />
                </Link>
            </div>

            <div className="w-full max-w-md px-4 z-10">
                {children}
            </div>
        </div>
    );
}
