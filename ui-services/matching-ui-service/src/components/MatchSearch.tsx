import React, { useEffect, useState } from "react";
import MatchStatusUI from "./MatchSearchUi";
import {
  requestMatch,
  type UserPreferences,
  type MatchResult,
  type MatchingResponse,
} from "@/api/matchingService";
import {
  startCollabSession,
  type CollabSession,
  waitForActiveSession,
} from "@/api/collabService";

interface MatchSearchProps {
  userId: string;
  preferences: Omit<UserPreferences, "userId">;
  onMatchFound: (matchData: MatchingResponse, session: CollabSession) => void;
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
  }, [view, messages.length]);

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

        switch (result.status) {
          case "found": {
            const sortedUsers = [userId, result.data.userId].sort();
            const questionId =
              result.data.questionId ?? "placeholder-questionId";

            const isPrimaryRequester = sortedUsers[0] === userId;

            try {
              let session: CollabSession | null = null;

              if (isPrimaryRequester) {
                session = await startCollabSession({
                  questionId,
                  users: sortedUsers,
                });
              } else {
                session = await waitForActiveSession(sortedUsers);
              }

              if (!session) {
                throw new Error("No active session created");
              }

              if (aborted) {
                return;
              }

              onMatchFound(result.data, session);
            } catch (sessionError) {
              console.error(
                "Failed to initialise collaboration session",
                sessionError,
              );
              if (!aborted) {
                setView("matchError");
              }
            }
            break;
          }
          case "notFound":
            if (!aborted) {
              setView("matchNotFound");
            }
            break;
          case "cancelled":
            if (!aborted) {
              setView("matchError");
            }
            break;
          case "error":
            if (!aborted) {
              setView("matchError");
            }
            break;
        }
      } catch (err) {
        console.error("Match request failed:", err);
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
