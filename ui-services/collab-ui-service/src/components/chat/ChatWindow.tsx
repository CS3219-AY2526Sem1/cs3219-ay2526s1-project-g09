import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import { io, Socket } from "socket.io-client";
import type { User } from "@/types/User";
import { useCollabSession } from "@/context/CollabSessionHook";
import {
  CHAT_URL,
  type MessagePayload,
  type SystemMessagePayload,
} from "@/api/chatService";

interface ChatWindowProps {
  user?: User | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ user }) => {
  const [chatInput, setChatInput] = useState<string>("");
  const [messages, setMessages] = useState<
    { sender: string; text: string; isUser: boolean; isSystem?: boolean }[]
  >([]);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState<boolean>(true);
  const { session } = useCollabSession();
  const socketRef = useRef<Socket | null>(null);
  const socketReadyRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  function handleSystemMessage(message: SystemMessagePayload) {
    const { event } = message;

    switch (event) {
      case "connect":
      case "reconnect": {
        setIsOtherUserOnline(true);
        break;
      }

      case "disconnect": {
        setIsOtherUserOnline(false);
        break;
      }

      default: {
        console.log("Unknown system event:", event);
        break;
      }
    }
  }

  useEffect(() => {
    if (socketRef.current) {
      console.log("Socket already initialized, skipping re-init");
      return;
    }
    if (!session?.sessionId || !user?.id || !user?.username) return;

    const socket = io(CHAT_URL, {
      path: "/api/v1/chat-service/socket.io",
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;
    socketReadyRef.current = false;

    socket.on("connect", () => {
      socketReadyRef.current = true;

      socket.emit("join_room", {
        userId: user?.id,
        username: user?.username,
        roomId: session.sessionId,
      });
    });

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

    socket.on("system_message", (message: SystemMessagePayload) => {
      if (message.userId === user?.id) return;

      setMessages((prev) => [
        ...prev,
        {
          sender: "System",
          text: message.text,
          isUser: false,
          isSystem: true,
        },
      ]);
      handleSystemMessage(message);
    });

    return () => {
      socket.off("receive_message");
      socket.off("system_message");
      socket.disconnect();
      socketRef.current = null;
      socketReadyRef.current = false;
    };
  }, [session?.sessionId, user?.id, user?.username]);

  useEffect(() => {
    const handleLeaveSession = () => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        console.warn("Socket not connected, skipping leave_session emit");
        return;
      }

      console.log("Manually leaving chat session...");
      socket.emit("leave_session");
      socket.disconnect();
      socketRef.current = null;
      socketReadyRef.current = false;
    };

    window.addEventListener(
      "collab:leave-session-confirmed",
      handleLeaveSession,
    );

    return () => {
      window.removeEventListener(
        "collab:leave-session-confirmed",
        handleLeaveSession,
      );
    };
  }, [session?.sessionId, user?.id]);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;

    const socket = socketRef.current;

    const newMessage = {
      senderId: user?.id,
      text: chatInput,
    };

    setMessages((prev) => [
      ...prev,
      { sender: "You", text: chatInput, isUser: true },
    ]);

    socket.emit("send_message", { message: newMessage });

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
        <div ref={messagesEndRef} />
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
