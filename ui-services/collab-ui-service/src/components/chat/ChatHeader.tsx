import React from "react";

const ChatHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-4 space-x-2">
      <span className="text-sm font-semibold text-white">CoconutTea</span>
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
    </div>
  );
};

export default ChatHeader;
