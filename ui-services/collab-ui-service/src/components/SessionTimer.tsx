import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SessionTimerProps {
  initialTimeInSeconds?: number;
}

const SessionTimer: React.FC<SessionTimerProps> = ({
  initialTimeInSeconds = 310,
}) => {
  const [time, setTime] = useState(initialTimeInSeconds);
  
  // Calculate if time is less than 5 minutes (300 seconds)
  const isLowTime = time < 300;

  useEffect(() => {
    if (time <= 0) return;
    const timerId = setInterval(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [time]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <Button
      className={`
        text-white
        ${isLowTime ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-orange-700'}
      `}
    >
      {formatTime(time)}
    </Button>
  );
};

export default SessionTimer;