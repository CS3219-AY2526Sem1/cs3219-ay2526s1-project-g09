import { useState } from "react";
import QuestionPreferences from "@/components/question-preference/QuestionPreferences";
import MatchFound from "@/components/MatchFound";

import MatchSearch from "@/components/MatchSearch";
import StartMatching from "@/components/StartMatching";
import type { MatchingResponse, UserPreferences } from "@/api/matchingService";
import { cancelMatch } from "@/api/matchingService";

type PageView = "initial" | "preferences" | "matching" | "matchFound";

const MatchingPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>("initial");
  const [matchData, setMatchData] = useState<MatchingResponse | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const handleStartMatching = (): void => {
    setCurrentView("preferences");
  };

  const handleConfirmPreferences = (prefs: UserPreferences): void => {
    setPreferences(prefs);
    setCurrentView("matching");
  };

  const handleMatchFound = (): void => {
    setCurrentView("matchFound");
  };

  const handleCancel = async (): Promise<void> => {
    if (preferences) {
      await cancelMatch("TEST_USER");
    }

    setCurrentView("initial");
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center">
      {currentView === "initial" && (
        <StartMatching onStart={handleStartMatching} />
      )}

      {currentView === "preferences" && (
        <QuestionPreferences
          onConfirm={handleConfirmPreferences}
          userId={"TEST_USER"}
        />
      )}

      {currentView === "matching" && preferences && (
        <MatchSearch
          userId={"TEST_USER"}
          preferences={preferences}
          onMatchFound={(data) => {
            setMatchData(data);
            handleMatchFound();
          }}
          onCancel={handleCancel}
        />
      )}

      {currentView === "matchFound" && matchData && (
        <MatchFound
          matchedName={matchData.userId}
          difficulty={matchData.difficulties[0]}
          timeMins={matchData.minTime}
          topic={matchData.topics[0]}
          onCancel={handleCancel}
        />
      )}
    </main>
  );
};

export default MatchingPage;
