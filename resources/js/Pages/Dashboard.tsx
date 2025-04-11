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
        if (meetingId.trim() === '') return;
        router.visit(`/meeting/${meetingId}`);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200"></h2>}
        >
            <Head title="Meeting" />

            <div className="py-12 bg-gradient-to-t from-green-300 via-blue-300 to-green-300 w-full">
                <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-500 to-blue-300 shadow-xl rounded-xl p-6">
                    <div className="bg-blue-300 shadow-sm sm:rounded-lg grid gap-8 grid-cols-1 md:grid-cols-2 py-8">
                        {/* Left Section */}
                        <div className="flex flex-col justify-center p-4 sm:p-10">
                            <h1 className="text-3xl sm:text-4xl font-semibold">
                                Let’s video meetings.
                            </h1>
                            <h1 className="mb-5 text-3xl sm:text-4xl font-semibold">
                                Now free for everyone.
                            </h1>
                            <p className="text-sm sm:text-base">
                                We re-engineered the service we built for secure business meetings, Google Meet,
                                to make it free and available for all.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mt-10">
                                <PrimaryButton
                                    onClick={newMeetingHandle}
                                    className="sm:col-span-2 w-full"
                                >
                                    New Meeting
                                </PrimaryButton>
                                <TextInput
                                    onChange={(e) => setMeetingId(e.target.value)}
                                    className="sm:col-span-3 w-full"
                                    placeholder="Enter meeting code"
                                />
                                <SecondaryButton
                                    onClick={handleJoin}
                                    className="sm:col-span-1 w-full"
                                >
                                    Join
                                </SecondaryButton>
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex flex-col items-center justify-center px-4 sm:px-10">
                            <img
                                src="/asset/Logo.png"
                                alt="Logo"
                                className="w-80 h-80 rounded-full mx-auto"
                            />
                            <p className="mt-6 mb-2 text-xl sm:text-2xl text-center font-medium">
                                Get a link you can share
                            </p>
                            <p className="text-sm sm:text-base text-center">
                                Click <strong>New meeting</strong> to get a link you can send to people you want to meet with.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
