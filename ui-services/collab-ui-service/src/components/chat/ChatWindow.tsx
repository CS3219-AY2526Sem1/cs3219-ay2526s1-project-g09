import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import { io, Socket } from "socket.io-client";
import type { User } from "@/types/User";
import { useCollabSession } from "@/context/CollabSessionHook";

interface ChatWindowProps {
  user?: User | null;
}

interface MessagePayload {
  senderId?: string;
  text: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ user }) => {
  const [chatInput, setChatInput] = useState<string>("");
  const [messages, setMessages] = useState<
    { sender: string; text: string; isUser: boolean; isSystem?: boolean }[]
  >([]);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState<boolean>(true);
  const { session } = useCollabSession();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.sessionId) return;

    const socket = io("http://localhost:5286", {
      auth: { userId: user?.id, username: user?.username },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_room", { roomId: session.sessionId });
    });

    // Listen for messages from server
    socket.on("receive_message", (message: MessagePayload) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: message.senderId || "Unknown user",
          text: message.text,
          isUser: false,
        },
      ]);
    });

    socket.on("user_left", (message: MessagePayload) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "System",
          text: message.text,
          isUser: false,
          isSystem: true,
        },
      ]);
      setIsOtherUserOnline(false);
    });

    return () => {
      socket.off("receive_message");
      socket.disconnect();
    };
  }, [session?.sessionId, user?.id, user?.username]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;

    const newMessage = {
      senderId: user?.id,
      text: chatInput,
    };

    setMessages((prev) => [
      ...prev,
      { sender: "You", text: chatInput, isUser: true },
    ]);

    socketRef.current.emit("send_message", { message: newMessage });

    setChatInput("");
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-800 p-4 rounded-lg shadow-md overflow-hidden">
      {/* Chat header */}
      <ChatHeader currentUser={user} isOtherUserOnline={isOtherUserOnline} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-2 mt-2">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            text={msg.text}
            isUser={msg.isUser}
            isSystem={msg.isSystem}
          />
        ))}
      </div>

      {/* Input */}
      <div className="flex mt-2">
        <Input
          type="text"
          placeholder="Send a message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          className="flex-1 mr-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
        />
        <Button
          onClick={handleSendMessage}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2"
        >
          &gt;
        </Button>
      </div>
    </div>
  );
};

export default ChatWindow;
