import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatHeader from "./ChatHeader"; // Import the new header component
import ChatMessage from "./ChatMessage"; // Import the new message component

const ChatWindow: React.FC = () => {
  const [chatInput, setChatInput] = useState<string>("");
  const [messages, setMessages] = useState<
    { sender: string; text: string; isUser: boolean }[]
  >([
    { sender: "CoconutTea", text: "Hello There", isUser: false },
    { sender: "You", text: "General Kenobi.", isUser: true },
    { sender: "You", text: "General Kenobi.", isUser: true },
    { sender: "You", text: "General Kenobi.", isUser: true },
    { sender: "You", text: "General Kenobi.", isUser: true },
    { sender: "You", text: "General Kenobi.", isUser: true },
  ]);

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      setMessages((prev) => [
        ...prev,
        { sender: "You", text: chatInput, isUser: true },
      ]);
      setChatInput("");
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-800 p-4 rounded-lg shadow-md overflow-hidden">
      {/* Chat header */}
      <ChatHeader />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-2 mt-2">
        {messages.map((msg, index) => (
          <ChatMessage key={index} text={msg.text} isUser={msg.isUser} />
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
