import { Link, InertiaLinkProps } from '@inertiajs/react';

export default function NavLink({ active = false, className = '', children, ...props }: InertiaLinkProps & { active: boolean }) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center px-1 pt-1 border-b-2 text-xl text-2xl font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-indigo-400 dark:border-indigo-600 text-gray-900 dark:text-gray-100 focus:border-indigo-700 '
                    : 'border-transparent text-gray-500 dark:text-blue-500 hover:text-white-700 dark:hover:text-black-300 hover:border-gray-300 dark:hover:border-gray-700 focus:text-black-700 dark:focus:text-black-300 focus:border-gray-300 dark:focus:border-black-700 ') +
                className
            }
        >
            {children}
        </Link>
    );
}
