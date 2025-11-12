import React from "react";
import type { User } from "@/types/User";
import { useCollabSession } from "@/context/CollabSessionHook";

interface ChatHeaderProps {
  currentUser?: User | null;
  isOtherUserOnline?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentUser,
  isOtherUserOnline = true,
}) => {
  const { session } = useCollabSession();
  let otherUser = "Unknown User";
  if (currentUser && session?.users) {
    const foundUser = session.users.find((u) => u !== currentUser.username);
    if (foundUser) otherUser = foundUser;
  }
  return (
    <div className="flex items-center justify-center p-4 space-x-2">
      <span className="text-sm font-semibold text-white">{otherUser}</span>
      <div
        className={`w-2 h-2 rounded-full ${
          isOtherUserOnline
            ? "bg-green-500 animate-pulse"
            : "bg-red-500 animate-pulse"
        }`}
      ></div>{" "}
    </div>
  );
};

export default ChatHeader;
