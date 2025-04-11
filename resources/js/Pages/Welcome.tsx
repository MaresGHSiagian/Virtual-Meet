import { Link, Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import WelcomeBackground from '@/Components/WelcomeBackground';

export default function Welcome({ auth, laravelVersion, phpVersion }: PageProps<{ laravelVersion: string, phpVersion: string }>) {
    return (
        <>
            <Head title="Welcome" />
            <div className="relative min-h-screen overflow-hidden">
                <WelcomeBackground />
                <div className="sm:fixed sm:top-0 sm:right-0 p-6 text-right z-10">
                    {auth.user ? (
                        <Link
                            href={route('dashboard')}
                            className="font-semibold text-white hover:text-blue-200 focus:outline focus:outline-2 focus:rounded-sm focus:outline-blue-400"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <Link
                            href={route('login')}
                            className="font-semibold text-blue-600 hover:text-green-500 focus:outline focus:outline-2 focus:rounded-sm focus:outline-blue-400"
                        >
                            Log in
                        </Link>
                    )}
                </div>
                <div className="relative flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6 lg:px-8">
    <div>
        <h1 className="text-4xl tracking-tight font-extrabold text-black sm:text-5xl md:text-6xl">
            Welcome to Video Meeting
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-black-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Connect with anyone, anywhere. Start your virtual meeting experience today.
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
                <Link
                    href={route(auth.user ? 'login' : 'register')}
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-100 md:py-4 md:text-lg md:px-10"
                >
                    {auth.user ? 'Back To Home' : 'Register Now'}
                </Link>
            </div>
        </div>
    </div>
</div>

            </div>
        </>
    );
}
