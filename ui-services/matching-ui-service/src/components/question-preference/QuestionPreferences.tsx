import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import TopicSelector from "./TopicSelector";
import DifficultySelector from "./DifficultySelector";
import TimeLimitSelector from "./TimeLimitSelector";
import {
  requestPreference,
  createPreference,
  type UserPreferences,
} from "@/api/matchingService";

interface QuestionPreferencesProps {
  userId: string;
  onConfirm: (preferences: UserPreferences) => void;
}

const QuestionPreferences: React.FC<QuestionPreferencesProps> = ({
  userId,
  onConfirm,
}) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    [],
  );
  const [timeMin, setTimeMin] = useState<number>(10);
  const [timeMax, setTimeMax] = useState<number>(120);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Save preferences
  const handleConfirm = async () => {
    const preferences: UserPreferences = {
      userId,
      topics: selectedTopics,
      difficulties: selectedDifficulties,
      minTime: timeMin,
      maxTime: timeMax,
    };

    setSubmitting(true);
    setError(null);

    const result = await createPreference(userId, preferences);
    setSubmitting(false);

    if (result.status === "found") {
      onConfirm(result.data); // pass saved prefs up to parent
    } else {
      setError("Failed to save preferences. Please try again.");
    }
  };

  // Load existing preferences on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchPreferences() {
      const result = await requestPreference(userId);

      if (!isMounted) return;

      if (result.status === "found") {
        const prefs = result.data as UserPreferences;
        setSelectedTopics(prefs.topics ?? []);
        setSelectedDifficulties(prefs.difficulties ?? []);
        setTimeMin(prefs.minTime ?? 10);
        setTimeMax(prefs.maxTime ?? 120);
      }

      setLoading(false);
    }

    fetchPreferences();

    return () => {
      isMounted = false;
    };
  }, [userId]); // ✅ run only when userId changes

  if (loading) {
    return <div className="text-white p-8">Loading preferences...</div>;
  }

  return (
    <div className="text-white p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TopicSelector
          selectedTopics={selectedTopics}
          setSelectedTopics={setSelectedTopics}
        />
        <div className="space-y-8 text-start">
          <DifficultySelector
            selectedDifficulties={selectedDifficulties}
            setSelectedDifficulties={setSelectedDifficulties}
          />
          <TimeLimitSelector
            timeMin={timeMin}
            timeMax={timeMax}
            setTimeMin={(value) => setTimeMin(value)}
            setTimeMax={(value) => setTimeMax(value)}
          />
        </div>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <div className="mt-8">
        <Button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6"
        >
          {submitting ? "Saving..." : "Confirm Preferences!"}
        </Button>
      </div>
    </div>
  );
};

export default QuestionPreferences;
