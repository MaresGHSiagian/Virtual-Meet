import { useState, PropsWithChildren, ReactNode } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link } from '@inertiajs/react';
import { User } from '@/types';


const getAvatarColor = (name: string) => {
    const colors = [
        "bg-red-500", "bg-green-500", "bg-blue-500", "bg-yellow-500",
        "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
        "bg-orange-500", "bg-rose-500"
    ];

    // Buat hash sederhana dari nama
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

const getInitials = (name: string) => {
    const words = name.trim().split(" ");
    return words.map((word) => word[0].toUpperCase()).join("").slice(0, 2); // maksimal 2 huruf
};



export default function Authenticated({
    user,
    header,
    children,
    headerClassName,
    headerTextClassName,
    navbarClassName,
}: PropsWithChildren<{
    user: User,
    header?: ReactNode,
    headerClassName?: string,
    headerTextClassName?: string,
    navbarClassName?: string
}>) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    // Default values jika tidak diberikan dari halaman
    const resolvedHeaderClassName = headerClassName ?? "bg-gradient-to-r from-green-600 to-blue-300 shadow";
    const resolvedHeaderTextClassName = headerTextClassName ?? "text-gray-800 dark:text-gray-200";
    const resolvedNavbarClassName = navbarClassName ?? "bg-gradient-to-r from-green-600/60 to-blue-300/60 shadow-md backdrop-blur-md";

    return (
        <div className="min-h-screen min-w-[75vw] overflow-x-auto bg-transparent">
            <nav className={resolvedNavbarClassName}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col">
                        <div className="flex justify-between h-16">
                            <div className="flex">
                                <div className="shrink-0 flex items-center">
                                    <Link href="/">
                                        <ApplicationLogo className="block h-9 w-auto fill-current text-white/80 dark:text-white/80" />
                                    </Link>
                                </div>
                                <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                                    <NavLink
                                        href={route('dashboard')}
                                        active={route().current('dashboard')}
                                        className={`text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-green-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg hover:text-white ${resolvedHeaderTextClassName}`}
                                    >
                                        Dashboard
                                    </NavLink>
                                </div>
                            </div>
                            <div className="hidden sm:flex sm:items-center sm:ml-6">
                                <div className="ml-3 relative">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex items-center gap-1 rounded-md cursor-pointer">
                                                {/* Avatar inisial */}
                                                <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
                                                    {getInitials(user.name)}
                                                </div>
                                            </span>
                                        </Dropdown.Trigger>
                                        <Dropdown.Content contentClasses="mt-2 w-55 rounded-md shadow-lg 
                                            bg-black dark:bg-blue-600 border border-gray-600 dark:border-gray-500">
                                            <Dropdown.Link
                                                href={route('profile.edit')}
                                                className="transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-400 hover:to-green-400 hover:text-white hover:scale-105"
                                            >
                                                Profile
                                            </Dropdown.Link>
                                            <Dropdown.Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                className="transition-all duration-200 hover:bg-gradient-to-r hover:from-red-400 hover:to-pink-400 hover:text-white hover:scale-105"
                                            >
                                                Log Out
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>
                            <div className="-mr-2 flex items-center sm:hidden">
                                <button
                                    onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-900 focus:text-gray-500 dark:focus:text-gray-400 transition duration-150 ease-in-out"
                                >
                                    <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                        <path
                                            className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                        <path
                                            className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        {/* Tambahkan teks Profile di bawah Dashboard jika di halaman profile */}
                        {resolvedHeaderTextClassName?.includes('profile-navbar-title') && (
                            <div className="ml-12 mt-2">
                                <span className="font-semibold text-xl leading-tight text-white/90 bg-gradient-to-r from-blue-400/40 via-green-400/40 to-cyan-400/40 px-4 py-1 rounded-lg shadow">
                                    Profile
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'}>
                    <div className="pt-2 pb-3 space-y-1">
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                            Dashboard
                        </ResponsiveNavLink>
                    </div>
                    <div className="pt-4 pb-1 border-t border-gray-200 dark:border-gray-600">
                        <div className="px-4">
                            <div className="font-bold text-white bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center mb-1">
                                {getInitials(user.name)}
                            </div>
                            <div className="font-medium text-sm text-gray-500">{user.email}</div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink
                                href={route('profile.edit')}
                                className="transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-400 hover:to-green-400 hover:text-white hover:scale-105"
                            >
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                                className="transition-all duration-200 hover:bg-gradient-to-r hover:from-red-400 hover:to-pink-400 hover:text-white hover:scale-105"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>
            {header && (
                <header className={resolvedHeaderClassName}>
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        <div className={resolvedHeaderTextClassName}>{header}</div>
                    </div>
                </header>
            )}
            <main>{children}</main>
            <footer className="bg-gradient-to-r from-green-600/60 to-blue-300/60 p-4 text-white/80 shadow-md w-full text-left text-sm sm:text-base flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 backdrop-blur-md">
                <p className="m-0">Mares Siagian-2025</p>
                {/* Tambahkan konten lain di sini jika perlu */}
            </footer>
        </div>
    );
}
