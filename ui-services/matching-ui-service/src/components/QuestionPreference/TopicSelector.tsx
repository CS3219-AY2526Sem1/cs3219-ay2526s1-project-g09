import { Button } from "@/components/ui/button";
import { getCategoriesWithDifficulties } from "@/api/routes/questionService";
import { useEffect, useState } from "react";

interface TopicSelectorProps {
  selectedTopics: Record<string, string[]>; // e.g. { "OOP": ["Easy"], "Python": ["Hard"] }
  setSelectedTopics: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopics,
  setSelectedTopics,
}) => {
  const [topics, setTopics] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch topics with difficulties */
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const data = await getCategoriesWithDifficulties();
        setTopics(data);
      } catch (err: unknown) {
        console.error("Failed to load topics:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch topics");
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  /** All unique difficulties across topics (for consistent button layout) */
  const allDifficulties = Array.from(
    new Set(Object.values(topics).flat()),
  ).sort(
    (a, b) =>
      ["Easy", "Medium", "Hard"].indexOf(a) -
      ["Easy", "Medium", "Hard"].indexOf(b),
  );

  /** Toggles one difficulty for a topic */
  const handleDifficultyToggle = (topic: string, difficulty: string) => {
    setSelectedTopics((prev) => {
      const newMap = { ...prev };
      const current = newMap[topic] || [];

      newMap[topic] = current.includes(difficulty)
        ? current.filter((d) => d !== difficulty)
        : [...current, difficulty];

      if (newMap[topic].length === 0) delete newMap[topic];
      return newMap;
    });
  };

  /** Toggles entire topic (select all / deselect all) */
  const handleTopicToggle = (topic: string, diffs: string[]) => {
    setSelectedTopics((prev) => {
      const newMap = { ...prev };
      if (newMap[topic]?.length === diffs.length) delete newMap[topic];
      else newMap[topic] = [...diffs];
      return newMap;
    });
  };

  /** Select / Deselect all topics */
  const handleSelectAll = () =>
    setSelectedTopics(Object.fromEntries(Object.entries(topics)));
  const handleDeselectAll = () => setSelectedTopics({});

  const isAllSelected =
    Object.keys(selectedTopics).length === Object.keys(topics).length;

  /** --- Render --- */
  if (loading)
    return (
      <div className="p-4 text-center text-white text-lg">
        Loading topics...
      </div>
    );

  if (error)
    return <div className="p-4 text-center text-red-400 text-lg">{error}</div>;

  return (
    <div className="rounded-lg shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-semibold text-white">
          Question Preferences
        </h1>
        <Button
          onClick={isAllSelected ? handleDeselectAll : handleSelectAll}
          variant="outline"
          className="px-3 py-1 text-black"
        >
          {isAllSelected ? "Deselect All" : "Select All"}
        </Button>
      </div>

      {/* Topics */}
      <div className="space-y-4 overflow-y-auto h-[50vh] p-3">
        {Object.entries(topics).map(([topic, topicDiffs]) => {
          const selected = selectedTopics[topic] || [];
          const allSelected = selected.length === topicDiffs.length;

          return (
            <div
              key={topic}
              className="flex items-center justify-between gap-4"
            >
              {/* Topic button */}
              <Button
                onClick={() => handleTopicToggle(topic, topicDiffs)}
                variant={allSelected ? "default" : "outline"}
                className={`w-1/3 text-left ${
                  allSelected ? "bg-orange-500 text-white" : "text-black"
                } px-3 py-1`}
              >
                {topic}
              </Button>

              {/* Difficulty buttons */}
              <div className="w-2/3 flex flex-wrap gap-2 justify-between">
                {allDifficulties.map((diff) => {
                  const available = topicDiffs.includes(diff);
                  const selectedDiff = selected.includes(diff);

                  return (
                    <Button
                      key={diff}
                      size="sm"
                      variant={selectedDiff ? "default" : "outline"}
                      disabled={!available}
                      className={`w-30 text-center px-3 py-1 ${
                        selectedDiff
                          ? "bg-orange-500 text-white"
                          : !available
                            ? "opacity-50 cursor-not-allowed"
                            : "text-black border-white"
                      }`}
                      onClick={() =>
                        available && handleDifficultyToggle(topic, diff)
                      }
                    >
                      {diff}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopicSelector;
