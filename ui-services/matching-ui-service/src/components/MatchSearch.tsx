import React, { useEffect, useState } from "react";
import MatchStatusUI from "./MatchSearchUi";
import type {
  MatchResult,
  MatchingResponse,
} from "@/api/routes/matchingService";

interface MatchSearchProps {
  matchRequestPromise: Promise<MatchResult>;
  matchRequestTimeout: number; // in milliseconds
  onMatchFound: (matchData: MatchingResponse) => void;
  onMatchError: () => void;
  onMatchNotFound: () => void;
  onCancel: () => void;
}

const MatchingSearch: React.FC<MatchSearchProps> = ({
  matchRequestPromise,
  matchRequestTimeout,
  onMatchFound,
  onCancel,
  onMatchError,
  onMatchNotFound,
}) => {
  // Convert milliseconds to seconds for display
  const initialTimeSeconds = Math.floor(matchRequestTimeout / 1000);
  const [timeLeft, setTimeLeft] = useState(initialTimeSeconds);
  const [messageIndex, setMessageIndex] = useState(0);
  const [view, setView] = useState<
    "searching" | "matchNotFound" | "matchError"
  >("searching");

  const messages = [
    "Looking for a study buddy...",
    "Still searching...",
    "Almost there...",
    "Finding the best match...",
  ];

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Status messages
  useEffect(() => {
    if (view !== "searching") return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [view, messages.length]);

  // Handle the match request promise (only runs once when component mounts)
  useEffect(() => {
    let aborted = false;

    const handleMatchResult = async () => {
      try {
        const result = await matchRequestPromise;

        if (aborted) return;

        switch (result.status) {
          case "found":
            onMatchFound(result.data);
            break;
          case "notFound":
            setView("matchNotFound");
            break;
          case "cancelled":
            setView("matchError");
            break;
          case "error":
            setView("matchError");
            break;
        }
      } catch (err) {
        console.error("Match request failed:", err);
        if (!aborted) {
          setView("matchError");
        }
      }
    };

    handleMatchResult();

    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  return (
    <MatchStatusUI
      statusMessage={messages[messageIndex]}
      timeLeft={timeLeft}
      onCancel={onCancel}
      onMatchError={onMatchError}
      onMatchNotFound={onMatchNotFound}
      view={view}
    />
  );
};

export default MatchingSearch;
