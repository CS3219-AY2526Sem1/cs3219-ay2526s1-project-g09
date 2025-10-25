import React from "react";

interface SuspenseFallbackProps {
  message?: string;
}

export const SuspenseFallback: React.FC<SuspenseFallbackProps> = ({
  message = "Loading...",
}) => (
  <div className="p-6 text-center text-gray-500">
    <p>{message}</p>
  </div>
);
