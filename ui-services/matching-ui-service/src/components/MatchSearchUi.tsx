import React from "react";
import { Button } from "@/components/ui/button";
import MatchNotFoundDialog from "@/components/MatchNotFoundDialog";
import MatchErrorDialog from "@/components/MatchErrorDialog";

interface MatchSearchUiProps {
  statusMessage: string;
  timeLeft: number;
  onCancel: () => void;
  view: "searching" | "matchNotFound" | "matchError";
}

const MatchSearchUi: React.FC<MatchSearchUiProps> = ({
  statusMessage,
  timeLeft,
  onCancel,
  view,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-white">
      <h1 className="text-5xl font-bold mb-4">Matching...</h1>
      <p className="text-xl text-gray-300 mb-2">{statusMessage}</p>
      <div className="text-2xl text-gray-400 mb-8">{timeLeft}</div>
      <Button
        onClick={onCancel}
        className="px-4 py-2 bg-black text-white rounded-lg shadow hover:bg-gray-800 transition"
      >
        Cancel
      </Button>

      {view === "matchNotFound" && <MatchNotFoundDialog onClose={onCancel} />}

      {view === "matchError" && <MatchErrorDialog onClose={onCancel} />}
    </div>
  );
};

export default MatchSearchUi;
