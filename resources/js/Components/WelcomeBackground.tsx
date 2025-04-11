export default function WelcomeBackground() {
    return (
        <div className="absolute inset-0 -z-10 flex justify-center items-center overflow-hidden">
            <img
                src="/asset/Meeting.svg"
                alt="Meeting Illustration"
                className="max-w-5xl w-full h-auto object-contain opacity-50"
            />
        </div>
    );
}
