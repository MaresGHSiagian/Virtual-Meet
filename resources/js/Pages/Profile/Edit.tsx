import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';

export default function Edit({
    auth,
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={null}
            headerClassName="bg-gradient-to-r from-white/30 via-blue-300/30 to-green-300/30 dark:from-gray-900/30 dark:via-blue-900/30 dark:to-green-900/30 shadow"
            headerTextClassName=""
            navbarClassName="bg-gradient-to-r from-blue-400/30 via-green-400/30 to-cyan-400/30 dark:from-blue-900/40 dark:via-green-900/40 dark:to-cyan-900/40 shadow-none"
        >
            <Head title="Profile" />

            {/* Profile Title - aligned with Dashboard */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-1">
                <div className="flex items-center gap-6">
                 <span className="font-semibold text-xl leading-tight text-black/90 bg-gradient-to-r from-blue-400/40 via-green-400/40 to-cyan-400/40 px-5 py-2 rounded-lg shadow block w-fit">
                        Profile
                    </span>
                </div>
            </div>

            <div className="relative min-h-screen w-full">
                <img
                    src="/asset/Profile.svg"
                    alt="Profile Background"
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] object-contain -z-10 pointer-events-none"
                    style={{ maxWidth: '100vw', maxHeight: '100vh' }}
                    draggable={false}
                />
                <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="space-y-8">
                        <div className="p-6 sm:p-8 bg-gradient-to-r from-white/30 via-blue-300/30 to-green-300/30 dark:from-gray-900/30 dark:via-blue-900/30 dark:to-green-900/30 shadow-lg sm:rounded-xl">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </div>
                        <div className="p-6 sm:p-8 bg-gradient-to-r from-white/30 via-blue-300/30 to-green-300/30 dark:from-gray-900/30 dark:via-blue-900/30 dark:to-green-900/30 shadow-lg sm:rounded-xl">
                            <UpdatePasswordForm className="max-w-xl" />
                        </div>
                        <div className="p-6 sm:p-8 bg-gradient-to-r from-white/30 via-blue-300/30 to-green-300/30 dark:from-gray-900/30 dark:via-blue-900/30 dark:to-green-900/30 shadow-lg sm:rounded-xl">
                            <DeleteUserForm className="max-w-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
