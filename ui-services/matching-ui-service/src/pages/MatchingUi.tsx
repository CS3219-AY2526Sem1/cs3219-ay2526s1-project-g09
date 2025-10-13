import QuestionPreferences from "@/components/question-preference/QuestionPreferences";
import MatchFound from "@/components/MatchFound";
import MatchSearch from "@/components/MatchSearch";
import StartMatching from "@/components/StartMatching";
import { useMatching } from "@/hooks/useMatching";

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
  const {
    currentView,
    matchData,
    preferences,
    isWaitingForAcceptance,
    showRejectedDialog,
    matchRequestPromise,
    timeoutConfig,
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
  } = useMatching({ username: user?.username ?? "", onNavigate });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to access matching</p>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center">
      {currentView === "initial" && (
        <StartMatching onStart={handleStartMatching} />
      )}

      {currentView === "preferences" && (
        <QuestionPreferences
          onConfirm={handleConfirmPreferences}
          userId={user.username}
        />
      )}

      {currentView === "matching" && preferences && matchRequestPromise && (
        <MatchSearch
          matchRequestPromise={matchRequestPromise}
          matchRequestTimeout={timeoutConfig.matchRequestTimeout}
          onMatchFound={handleMatchFound}
          onCancel={handleCancel}
          onMatchNotFound={handleMatchNotFound}
          onMatchError={handleMatchError}
        />
      )}

      {currentView === "matchFound" && matchData?.match && (
        <MatchFound
          matchedName={matchData.match.userId ?? ""}
          {...getFirstTopicDifficultyAndTime(matchData.match)}
          acceptanceTimeout={timeoutConfig.matchAcceptanceTimeout}
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
