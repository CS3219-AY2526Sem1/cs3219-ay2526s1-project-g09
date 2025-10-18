import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import TopicSelector from "./TopicSelector";
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
  // Now using map/hash structure
  const [selectedTopics, setSelectedTopics] = useState<
    Record<string, string[]>
  >({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Save preferences
  const handleConfirm = async () => {
    const preferences: UserPreferences = {
      userId,
      topics: selectedTopics, // now map instead of string[]
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
        setSelectedTopics(prefs.topics ?? {}); // set map/hash
      }

      setLoading(false);
    }

    fetchPreferences();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading) {
    return <div className="text-white p-8">Loading preferences...</div>;
  }

  return (
    <div className="w-[40vw] p-8">
      <div className="grid grid-cols-1">
        <TopicSelector
          selectedTopics={selectedTopics}
          setSelectedTopics={setSelectedTopics}
        />
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
