import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import SecondaryButton from '@/Components/SecondaryButton';
import { useState } from 'react';
import useRandomStringGenerator from '@/hooks/useRandomStringGenerator';

export default function Dashboard({ auth }: PageProps) {
    const [meetingId, setMeetingId] = useState('');
    const generateNewRandomString = useRandomStringGenerator();

    const newMeetingHandle = () => {
        const randomString = generateNewRandomString(11);
        router.visit(`/meeting/${randomString}`);
    };

    const handleJoin = () => {
        if (meetingId.trim() === '') {
            window.alert('Silakan masukkan kode meeting!');
            return;
        }
        router.visit(`/meeting/${meetingId}`);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-semibold leading-tight">
                    {/* Dashboard */}
                </h2>
            }
        >
            <Head title="Meeting" />

            <div className="min-h-screen w-full py-12 bg-gradient-to-t from-green-300 via-blue-300 to-green-300 flex items-center justify-center">
                <div className="mx-auto max-w-5xl w-full px-2 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-b from-blue-500/80 to-blue-300/80 shadow-xl rounded-2xl p-4 sm:p-10 flex flex-col md:flex-row gap-8 items-center">
                        {/* Left Section */}
                        <div className="flex-1 flex flex-col justify-center gap-4">
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                                Let’s video meetings.
                            </h1>
                            <h2 className="mb-4 text-2xl sm:text-3xl font-semibold text-blue-900 dark:text-blue-200">
                                Now free for everyone.
                            </h2>
                            <p className="text-base text-gray-700 dark:text-gray-200">
                                We re-engineered the service we built for secure business meetings, Google Meet,
                                to make it free and available for all.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mt-8">
                                <PrimaryButton
                                    onClick={newMeetingHandle}
                                    className="sm:col-span-2 w-full transition-all duration-200 bg-gradient-to-r from-green-400 to-blue-500 hover:from-blue-500 hover:to-green-400 hover:shadow-xl hover:scale-105 focus:ring-4 focus:ring-blue-300"
                                >
                                    New Meeting
                                </PrimaryButton>
                                <TextInput
                                    onChange={(e) => setMeetingId(e.target.value)}
                                    className="sm:col-span-3 w-full transition-all duration-200 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-green-400 hover:shadow-lg rounded-lg"
                                    placeholder="Enter meeting code"
                                />
                                <SecondaryButton
                                    onClick={handleJoin}
                                    className="sm:col-span-1 w-full transition-all duration-200 bg-gradient-to-r from-blue-400 to-green-500 hover:from-green-500 hover:to-blue-400 hover:shadow-xl hover:scale-105 focus:ring-4 focus:ring-green-300"
                                >
                                    Join
                                </SecondaryButton>
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                            <img
                                src="/asset/Logo.png"
                                alt="Logo"
                                className="w-48 h-48 sm:w-64 sm:h-64 rounded-full mx-auto shadow-lg"
                            />
                            <p className="mt-4 mb-2 text-lg sm:text-2xl text-center font-medium text-gray-900 dark:text-white">
                                Get a link you can share
                            </p>
                            <p className="text-sm sm:text-base text-center text-gray-700 dark:text-gray-200">
                                Click <strong>New meeting</strong> to get a link you can send to people you want to meet with.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
