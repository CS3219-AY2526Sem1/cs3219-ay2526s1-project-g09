import React, { useState, useEffect } from "react";

interface MatchFoundProps {
  matchedName: string;
  difficulty: string;
  timeMins: number;
  topic: string;
  onCancel: () => void;
}

const formatTime = (totalMinutes: number) => {
  if (totalMinutes < 60) {
    return `${totalMinutes}min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes > 0) {
    return `${hours}h ${minutes}min`;
  }

  return `${hours}h`;
};

const MatchFound: React.FC<MatchFoundProps> = ({
  matchedName,
  difficulty = "N/A",
  timeMins = 0,
  topic = "N/A",
  onCancel,
}) => {
  const initialTime: number = 15;
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft === 0) {
      onCancel();
      return;
    }

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onCancel]);

  return (
    <div className="">
      {/*Matched with and question details*/}
      <div className="p-6">
        {/*Matched With*/}
        <h2 className="text-white text-5xl font-bold text-gray-900">
          Matched with <span className="text-sky-400">{matchedName}</span>
        </h2>

        {/*Match Details*/}
        <div className="flex gap-2 mt-3 justify-center">
          <span className="inline-flex items-center px-5 py-1.5 rounded text-xl font-medium bg-white text-black">
            {difficulty}
          </span>
          <span className="inline-flex items-center px-5 py-1.5 rounded text-xl font-medium bg-white text-black">
            {formatTime(timeMins)}
          </span>
          <span className="inline-flex items-center px-5 py-1.5 rounded text-xl font-medium bg-white text-black">
            {topic}
          </span>
        </div>
      </div>

      {/*Loading Animation*/}
      <div className="px-6 py-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-600 h-2 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / initialTime) * 100}%` }}
          />
        </div>
        <div className="text-center mt-3">
          <div className="text-1xl font-bold text-orange-600">{timeLeft}s</div>
        </div>
      </div>

      {/*Buttons*/}
      <div className="flex p-4 gap-10 justify-center">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-black text-white rounded-lg shadow hover:bg-gray-800 transition"
        >
          Cancel
        </button>
        <a href="/collab">
          <button className="px-8 py-3 bg-orange-600 text-white rounded-md text-lg font-semibold shadow hover:bg-orange-700 transition">
            Accept Match!
          </button>
        </a>
      </div>
    </div>
  );
};

export default MatchFound;
