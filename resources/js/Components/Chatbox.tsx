import { useEffect, useRef, useState } from "react";

interface ChatBoxProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatBox({ isOpen, onClose }: ChatBoxProps) {
    const [messages, setMessages] = useState<string[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const sendMessage = () => {
        if (newMessage.trim() === "") return;
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setNewMessage("");
    };

    // Auto-scroll ke bawah saat ada pesan baru
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    if (!isOpen) return null;

    return (
        <div className="absolute bottom-20 right-5 w-80 h-96 bg-white text-black p-4 rounded-lg shadow-lg flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold">Chat</h2>
                <button 
    className="text-red-500 hover:text-red-700 focus:outline-none" 
    onClick={onClose} 
    aria-label="Close Chat"
>
    <svg xmlns="http://www.w3.org/2000/svg" width="31" height="31" className="bi bi-x" viewBox="0 0 16 16">
        <path fill="currentColor" d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
    </svg>
</button>
            </div>

            {/* Chat Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto border p-2 rounded bg-gray-50"
            >
                {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center">No messages yet...</p>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className="bg-blue-100 p-2 my-1 rounded shadow-sm">
                            {msg}
                        </div>
                    ))
                )}
            </div>

            {/* Input & Send Button */}
            <div className="mt-2 flex">
                <input
                    type="text"
                    className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    aria-label="Message Input"
                />
                <button
                    className="ml-2 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition"
                    onClick={sendMessage}
                    aria-label="Send Message"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
