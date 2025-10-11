import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";

export interface MatchFoundProps {
  matchedName: string;
  difficulty: string;
  timeMins: number;
  topic: string;
  acceptanceTimeout: number; // in milliseconds
  onAccept: () => void;
  onReject: () => void;
  isWaiting?: boolean;
  showRejectedDialog?: boolean;
  onDismissRejected?: () => void;
}

const formatTime = (totalMinutes: number) => {
  if (totalMinutes < 60) return `${totalMinutes}min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
};

const MatchFound: React.FC<MatchFoundProps> = ({
  matchedName,
  difficulty,
  timeMins,
  topic,
  acceptanceTimeout,
  onAccept,
  onReject,
  isWaiting = false,
  showRejectedDialog = false,
  onDismissRejected,
}) => {
  // Convert milliseconds to seconds for display
  const initialTime = Math.floor(acceptanceTimeout / 1000);
  const [timeLeft, setTimeLeft] = useState(initialTime);

  // Timer countdown
  useEffect(() => {
    if (isWaiting) return; // Don't countdown when waiting

    if (timeLeft === 0) {
      onReject();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isWaiting, onReject]);

  // Reset timer when component mounts or isWaiting changes
  useEffect(() => {
    if (!isWaiting) {
      setTimeLeft(initialTime);
    }
  }, [isWaiting]);

  return (
    <div className="">
      <Dialog
        open={showRejectedDialog}
        onOpenChange={(open) => {
          if (!open && onDismissRejected) {
            onDismissRejected();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Match Rejected</DialogTitle>
            <DialogDescription>
              {matchedName} has rejected the match.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onDismissRejected}>Back to Start</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="p-6">
        <h2 className="text-white text-5xl font-bold text-gray-900">
          Matched with <span className="text-sky-400">{matchedName}</span>
        </h2>
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

      {isWaiting ? (
        // Waiting for other user's response
        <div className="px-6 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-sky-400 mb-4">
              Waiting for {matchedName} to accept...
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
            </div>
          </div>
        </div>
      ) : (
        // Countdown timer
        <>
          <div className="px-6 py-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / initialTime) * 100}%` }}
              />
            </div>
            <div className="text-center mt-3">
              <div className="text-1xl font-bold text-orange-600">
                {timeLeft}s
              </div>
            </div>
          </div>

          <div className="flex p-4 gap-10 justify-center">
            <button
              onClick={onReject}
              className="px-4 py-2 bg-black text-white rounded-lg shadow hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              className="px-8 py-3 bg-orange-600 text-white rounded-md text-lg font-semibold shadow hover:bg-orange-700 transition"
            >
              Accept Match!
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MatchFound;
