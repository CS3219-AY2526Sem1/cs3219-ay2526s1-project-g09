import React from "react";

interface ChatMessageProps {
  text: string;
  isUser: boolean;
  isSystem?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  text,
  isUser,
  isSystem,
}) => {
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-600 text-gray-200 text-xs italic px-3 py-1 rounded-full">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] p-3 rounded-lg ${
          isUser ? "bg-blue-600 ml-auto" : "bg-gray-700 mr-auto"
        }`}
      >
        <p className="text-sm">{text}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
