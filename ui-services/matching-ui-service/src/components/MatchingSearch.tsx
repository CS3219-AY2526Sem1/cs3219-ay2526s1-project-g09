import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface MatchingSearchProps {
  onMatchFound: () => void;
  onCancel: () => void;
}

const MatchingSearch: React.FC<MatchingSearchProps> = ({ onMatchFound, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState<number>(2); // 2-second timer

  useEffect(() => {
    // Exit the timer if time runs out or component unmounts
    if (timeLeft === 0) {
      onMatchFound();
      return;
    }

    // Set up the timer
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    // Clean up the timer when the component unmounts
    return () => clearTimeout(timer);
  }, [timeLeft, onMatchFound]);

  return (
    <div className="flex flex-col items-center justify-center text-center text-white">
      <h1 className="text-5xl font-bold mb-4">Matching...</h1>
      <div className="text-2xl text-gray-400 mb-8">{timeLeft}</div>
      <Button
        onClick={onCancel}
        className="px-4 py-2 bg-black text-white rounded-lg shadow hover:bg-gray-800 transition"
      >
        Cancel
      </Button>
    </div>
  );
};

export default MatchingSearch;