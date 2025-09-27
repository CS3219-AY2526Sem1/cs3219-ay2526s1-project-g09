import { useState } from "react";
import QuestionPreferences from "@/components/QuestionPreferences";
import MatchNotification from "@/components/MatchNotification";
import MatchingSearch from "@/components/MatchingSearch";

// Define the possible states for the view, including 'matching'
type PageView = "initial" | "preferences" | "matching" | "matchFound";

const MatchingPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>("initial");

  const handleStartMatching = (): void => {
    setCurrentView("preferences");
  };

  const handleConfirmPreferences = (): void => {
    console.log("Preferences confirmed. Starting the matching process...");
    setCurrentView("matching");
  };

  const handleMatchFound = (): void => {
    console.log("Match found! Showing notification.");
    setCurrentView("matchFound");
  };

  const handleCancelMatch = (): void => {
    console.log("Matching process cancelled.");
    setCurrentView("initial");
  };

  const handleAcceptMatch = (): void => {
    console.log("Match was accepted");
    setCurrentView("initial");
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center">
      {currentView === "initial" && (
        <div>
          <h1 className="text-5xl font-medium mb-8">Start a session</h1>
          <button
            className="px-8 py-3 bg-orange-600 text-white rounded-md text-lg font-semibold shadow hover:bg-orange-700 transition"
            onClick={handleStartMatching}
          >
            Start Matching!
          </button>
        </div>
      )}

      {currentView === "preferences" && (
        <QuestionPreferences onConfirm={handleConfirmPreferences} />
      )}

      {currentView === "matching" && (
        <MatchingSearch
          onMatchFound={handleMatchFound}
          onCancel={handleCancelMatch}
        />
      )}

      {currentView === "matchFound" && (
        <MatchNotification
          onCancel={handleCancelMatch}
          onAccept={handleAcceptMatch}
          initialTime={15}
        />
      )}
    </main>
  );
};

export default MatchingPage;
