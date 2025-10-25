import { useState, useEffect } from "react";
import type {
  MatchingResponse,
  UserPreferences,
  MatchResult,
  TimeoutConfig,
  MatchDetails,
} from "@/api/routes/matchingService";
import {
  cancelMatch,
  connectMatch,
  acceptMatch,
  rejectMatch,
  requestMatch,
  getTimeoutConfig,
} from "@/api/routes/matchingService";
import { type CollabSession } from "@/api/routes/collabService";
import { useNavigate } from "react-router-dom";

type PageView = "initial" | "preferences" | "matching" | "matchFound";

interface UseMatchingProps {
  username: string;
}

export function useMatching({ username }: UseMatchingProps) {
  const [currentView, setCurrentView] = useState<PageView>("initial");
  const [matchData, setMatchData] = useState<MatchingResponse | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false);
  const [showRejectedDialog, setShowRejectedDialog] = useState(false);
  const [matchRequestPromise, setMatchRequestPromise] =
    useState<Promise<MatchResult> | null>(null);
  const [timeoutConfig, setTimeoutConfig] = useState<TimeoutConfig>({
    matchRequestTimeout: 30000,
    matchAcceptanceTimeout: 30000,
  });
  const navigate = useNavigate();

  // Fetch timeout config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      const config = await getTimeoutConfig();
      setTimeoutConfig(config);
    };
    fetchConfig();
  }, []);

  const handleStartMatching = (): void => {
    setCurrentView("preferences");
  };

  const handleConfirmPreferences = (prefs: UserPreferences): void => {
    setPreferences(prefs);

    // Start the match request immediately
    const matchPromise = requestMatch(prefs);
    setMatchRequestPromise(matchPromise);

    // Move to matching view to show UI
    setCurrentView("matching");
  };

  const handleMatchFound = async (data: MatchingResponse): Promise<void> => {
    setMatchData(data);
    setCurrentView("matchFound");

    try {
      // Connect and wait for acceptance response (backend holds connection)
      const response = await connectMatch(username, data.matchId);

      if (response.status.toUpperCase() === "SUCCESS") {
        const sessionRecord = response.session as CollabSession | null;

        try {
          if (!sessionRecord) {
            throw new Error(
              "Collaboration session was not created for this match",
            );
          }

          const participants = [username, data.match.userId].sort();
          const isPrimaryRequester = participants[0] === username;

          if (
            isPrimaryRequester &&
            sessionRecord.users &&
            !sessionRecord.users.includes(username)
          ) {
            console.warn(
              "Collaboration session does not list the current user as a participant",
              sessionRecord,
            );
          }

          navigate("/collab");
        } catch (sessionError) {
          console.error(
            "Failed to initialise collaboration session",
            sessionError,
          );
        }
      } else if (response.status.toUpperCase() === "REJECTED") {
        setShowRejectedDialog(true);
      } else {
        setIsWaitingForAcceptance(true);
      }
    } catch (err) {
      console.error("Failed to connect to match", err);
    }
  };

  const handleAcceptMatch = async (): Promise<void> => {
    if (!matchData) return;

    try {
      // Just accept the match - connectMatch() is already waiting for response
      await acceptMatch(username, matchData.matchId);
      setIsWaitingForAcceptance(true);
    } catch (err) {
      console.error("Failed to accept match", err);
    }
  };

  const handleRejectMatch = async (): Promise<void> => {
    if (!matchData) return;

    try {
      await rejectMatch(username, matchData.matchId);
    } catch (err) {
      console.error("Failed to reject match", err);
    } finally {
      handleCancel();
    }
  };

  const handleCancel = async (): Promise<void> => {
    if (preferences) {
      await cancelMatch(username);
    }
    resetState();
  };

  const handleMatchError = (): void => {
    setMatchRequestPromise(null);
    setCurrentView("initial");
  };

  const handleMatchNotFound = (): void => {
    setMatchRequestPromise(null);
    setCurrentView("initial");
  };

  const handleDismissRejected = (): void => {
    setShowRejectedDialog(false);
    resetState();
  };

  const resetState = () => {
    setIsWaitingForAcceptance(false);
    setShowRejectedDialog(false);
    setMatchData(null);
    setMatchRequestPromise(null);
    setCurrentView("initial");
  };

  // Helper to extract first topic/difficulty and map to timeMins
  const getFirstTopicDifficultyAndTime = (match: MatchDetails) => {
    const topics = Object.entries(match.topics);
    if (topics.length === 0) return { topic: "", difficulty: "", timeMins: 0 };

    const [firstTopic, difficulties] = topics[0];
    const difficulty = difficulties[0];

    // Map difficulty to time
    let timeMins = 0;
    switch (difficulty) {
      case "Easy":
        timeMins = 30;
        break;
      case "Medium":
        timeMins = 60;
        break;
      case "Hard":
        timeMins = 120;
        break;
      default:
        timeMins = 0;
    }

    return { topic: firstTopic, difficulty, timeMins };
  };

  return {
    // State
    currentView,
    matchData,
    preferences,
    isWaitingForAcceptance,
    showRejectedDialog,
    matchRequestPromise,
    timeoutConfig,

    // Handlers
    handleStartMatching,
    handleConfirmPreferences,
    handleMatchFound,
    handleAcceptMatch,
    handleRejectMatch,
    handleCancel,
    handleMatchError,
    handleMatchNotFound,
    handleDismissRejected,
    getFirstTopicDifficultyAndTime,
  };
}
