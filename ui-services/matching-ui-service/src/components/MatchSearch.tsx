import React, { useEffect, useState } from "react";
import MatchStatusUI from "./MatchSearchUi";
import {
  requestMatch,
  type UserPreferences,
  type MatchResult,
  type MatchingResponse,
} from "@/api/matchingService";

interface MatchSearchProps {
  userId: string;
  preferences: Omit<UserPreferences, "userId">;
  onMatchFound: (matchData: MatchingResponse) => void;
  onCancel: () => void;
}

const MatchingSearch: React.FC<MatchSearchProps> = ({
  userId,
  preferences,
  onMatchFound,
  onCancel,
}) => {
  const [timeLeft, setTimeLeft] = useState(120);
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
  }, [view]);

  // Match request
  useEffect(() => {
    let aborted = false;

    const doRequest = async () => {
      try {
        const result: MatchResult = await requestMatch({
          userId,
          ...preferences,
        });

        if (aborted) return;

        if (result.status === "found") {
          onMatchFound(result.data);
        } else if (result.status === "notFound") {
          setView("matchNotFound");
        } else if (result.status === "error") {
          setView("matchError");
        }
      } catch (err) {
        if (!aborted) {
          setView("matchError");
        }
      }
    };

    doRequest();

    return () => {
      aborted = true;
    };
  }, [userId, preferences, onMatchFound]);

  return (
    <MatchStatusUI
      statusMessage={messages[messageIndex]}
      timeLeft={timeLeft}
      onCancel={onCancel}
      view={view}
    />
  );
};

export default MatchingSearch;
