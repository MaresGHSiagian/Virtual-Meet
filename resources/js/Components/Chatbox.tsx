import { useEffect, useRef, useState } from "react";

interface ChatBoxProps {
    isOpen: boolean;
    onClose: () => void;
    senderName: string;
}


export default function ChatBox({ isOpen, onClose, senderName }: ChatBoxProps) {
    const [newMessage, setNewMessage] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);


    const getInitials = (name: string) => {
        const words = name.trim().split(" ");
        return words.map((word) => word[0].toUpperCase()).join("");
    };
    // avatar
    const getAvatarColor = (name: string) => {
        const colors = [
            "bg-red-500",
            "bg-green-500",
            "bg-blue-500",
            "bg-yellow-500",
            "bg-pink-500",
            "bg-purple-500",
            "bg-indigo-500",
            "bg-emerald-500",
            "bg-teal-500",
            "bg-orange-500"
        ];
    
        // Simple hash based on character codes
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
    
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };
    
    // Ambil pesan dari backend
    const fetchMessages = async () => {
        try {
            const response = await fetch("/api/chat", {
                headers: {
                    "Accept": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch messages");
            const data = await response.json();
            // Pastikan data berupa array of { sender, text }
            setMessages(data);
        } catch (error) {
            // Opsional: tampilkan error ke user
            // alert("Gagal mengambil pesan");
        }
    };

    // Kirim pesan ke backend
    const sendMessageToBackend = async (sender: string, text: string) => {
        try {
            const response = await fetch("/api/chat/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ sender, text }),
            });
            if (!response.ok) {
                throw new Error("Failed to send message");
            }
            // Bisa return response.json() jika backend mengembalikan data
        } catch (error) {
            alert("Gagal mengirim pesan");
        }
    };

    const sendMessage = async () => {
        if (newMessage.trim() === "") return;

        const initials = getInitials(senderName);
        const message = {
            sender: initials,
            text: newMessage,
        };

        await sendMessageToBackend(message.sender, message.text);

        // Setelah kirim, refresh pesan dari backend agar sinkron
        await fetchMessages();
        setNewMessage("");
    };

    // Ambil pesan saat chatbox dibuka
    useEffect(() => {
        if (isOpen) {
            fetchMessages();
        }
    }, [isOpen]);

    // Scroll ke bawah setiap ada pesan baru
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    if (!isOpen) return null;

    return (
        <div className="absolute bottom-20 right-5 w-80 h-96 p-4 rounded-2xl shadow-2xl bg-gradient-to-br from-white/80 to-green-50/60 backdrop-blur-md border border-white-100 text-black flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
  <h2 className="text-lg font-bold">Chat</h2>

  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="31"
    height="31"
    viewBox="0 0 16 16"
    onClick={onClose}
    aria-label="Close Chat"
    className="text-red-500 hover:text-red-700 focus:outline-none cursor-pointer"
  >
    <path
      fill="currentColor"
      d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"
    />
  </svg>
</div>
            {/* Chat Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 rounded-xl bg-gradient-to-br from-blue-100 to-green-50 border border-white/40 shadow-inner scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#93c5fd transparent", // For Firefox
                }}
            >
              
              {messages.length === 0 ? (
    <p className="text-gray-500 text-sm text-center">No messages yet...</p>
) : (
    messages.map((msg, index) => (
        <div
            key={index}
            className="flex items-start gap-2 my-2"
        >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-md ${getAvatarColor(msg.sender)}`}>
    {msg.sender}
</div>


            {/* Message bubble */}
            <div className="bg-gradient-to-r from-blue-200 to-blue-100 p-2 rounded-xl shadow-md border border-blue-300 text-sm max-w-[75%]">
                {msg.text}
            </div>
        </div>
    ))
)}
            </div>

            {/* Input & Send Button */}
            <div className="mt-2 flex">
                <input
                    type="text"
                    className="flex-1 p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-xs"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    aria-label="Message Input"
                />
                <button
                   className="ml-2 bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition text-sm"
                    onClick={sendMessage}
                    aria-label="Send Message"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471z"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}
