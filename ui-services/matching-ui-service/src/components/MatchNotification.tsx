import React, { useState, useEffect } from "react";

interface MatchNotificationProps {
  onCancel?: () => void;
  onAccept?: () => void;
  initialTime?: number;
}

const MatchNotification: React.FC<MatchNotificationProps> = ({
  onCancel,
  onAccept,
  initialTime = 15,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);
  const [isVisible] = useState<boolean>(true);

  useEffect(() => {
    if (timeLeft === 0) {
      handleCancel();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleCancel = (): void => {
    //setIsVisible(false);
    onCancel?.();
  };

  const handleAccept = (): void => {
    //setIsVisible(false);
    onAccept?.();
  };

  if (!isVisible) return null;

  return (
    <div className="">
      <div className="p-6">
        <h2 className="text-white text-5xl font-bold text-gray-900">
          Matched with <span className="text-sky-400">IrishFamine</span>
        </h2>
        <div className="flex gap-2 mt-3 justify-center">
          <span className="inline-flex items-center px-5 py-1.5 rounded text-xl font-medium bg-white text-black">
            Easy
          </span>
          <span className="inline-flex items-center px-5 py-1.5 rounded text-xl font-medium bg-white text-black">
            1:30
          </span>
          <span className="inline-flex items-center px-5 py-1.5 rounded text-xl font-medium bg-white text-black">
            Database
          </span>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-600 h-2 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / initialTime) * 100}%` }}
          ></div>
        </div>

        <div className="text-center mt-3">
          <div className="text-1xl font-bold text-orange-600">{timeLeft}s</div>
        </div>
      </div>

      <div className="flex p-4 gap-10 justify-center">
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-black text-white rounded-lg shadow hover:bg-gray-800 transition"
        >
          Cancel
        </button>
        <a href="/collab">
          <button
            onClick={handleAccept}
            className="px-8 py-3 bg-orange-600 text-white rounded-md text-lg font-semibold shadow hover:bg-orange-700 transition"
          >
            Accept Match!
          </button>
        </a>
      </div>
    </div>
  );
};

export default MatchNotification;
