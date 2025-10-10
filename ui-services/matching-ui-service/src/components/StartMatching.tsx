import React from "react";

interface StartMatchingProps {
  onStart: () => void;
}

const StartMatching: React.FC<StartMatchingProps> = ({ onStart }) => {
  return (
    <div>
      <h1 className="text-5xl font-medium mb-8">Start a session</h1>
      <button
        className="px-8 py-3 bg-orange-600 text-white rounded-md text-lg font-semibold shadow hover:bg-orange-700 transition"
        onClick={onStart}
      >
        Start Matching!
      </button>
    </div>
  );
};

export default StartMatching;
