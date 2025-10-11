import { useState } from "react";
import QuestionPreferences from "@/components/question-preference/QuestionPreferences";
import MatchFound from "@/components/MatchFound";
import MatchSearch from "@/components/MatchSearch";
import StartMatching from "@/components/StartMatching";
import type {
  MatchingResponse,
  UserPreferences,
  MatchResult,
} from "@/api/matchingService";
import {
  cancelMatch,
  connectMatch,
  acceptMatch,
  rejectMatch,
  requestMatch,
} from "@/api/matchingService";

type PageView = "initial" | "preferences" | "matching" | "matchFound";

interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface MatchingPageProps {
  user: User | null;
  onNavigate?: (path: string) => void;
}

const MatchingPage: React.FC<MatchingPageProps> = ({ user, onNavigate }) => {
  const [currentView, setCurrentView] = useState<PageView>("initial");
  const [matchData, setMatchData] = useState<MatchingResponse | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false);
  const [showRejectedDialog, setShowRejectedDialog] = useState(false);
  const [matchRequestPromise, setMatchRequestPromise] =
    useState<Promise<MatchResult> | null>(null);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to access matching</p>
      </div>
    );
  }

  const username = user.username;

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
        // Both users accepted - navigate to collab
        if (onNavigate) {
          onNavigate("/collab");
        }
      } else if (response.status.toUpperCase() === "REJECTED") {
        // Other user rejected
        setShowRejectedDialog(true);
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
    setIsWaitingForAcceptance(false);
    setShowRejectedDialog(false);
    setMatchData(null);
    setMatchRequestPromise(null);
    setCurrentView("initial");
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
    setCurrentView("initial");
    // handleCancel();
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center">
      {currentView === "initial" && (
        <StartMatching onStart={handleStartMatching} />
      )}
      {currentView === "preferences" && (
        <QuestionPreferences
          onConfirm={handleConfirmPreferences}
          userId={username}
        />
      )}
      {currentView === "matching" && preferences && matchRequestPromise && (
        <MatchSearch
          matchRequestPromise={matchRequestPromise}
          onMatchFound={handleMatchFound}
          onCancel={handleCancel}
          onMatchNotFound={handleMatchNotFound}
          onMatchError={handleMatchError}
        />
      )}
      {currentView === "matchFound" && matchData && (
        <MatchFound
          matchedName={matchData.match.userId}
          difficulty={matchData.match.difficulties[0]}
          timeMins={matchData.match.minTime}
          topic={matchData.match.topics[0]}
          onAccept={handleAcceptMatch}
          onReject={handleRejectMatch}
          isWaiting={isWaitingForAcceptance}
          showRejectedDialog={showRejectedDialog}
          onDismissRejected={handleDismissRejected}
        />
      )}
    </main>
  );
};

export default MatchingPage;
