import { Button } from "@/components/ui/button";

interface TopicSelectorProps {
  selectedTopics: Record<string, string[]>; // e.g. { "OOP": ["Easy"], "Python": ["Hard"] }
  setSelectedTopics: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
}

// Dummy topics in map/hash format
const topics: Record<string, string[]> = {
  OOP: ["Easy", "Medium"],
  Database: ["Medium", "Hard"],
  Algorithm: ["Easy", "Hard"],
  AI: ["Medium", "Hard"],
  Python: ["Easy", "Medium", "Hard"],
  Java: ["Easy", "Medium"],
  Ruby: ["Easy"],
  Perl: ["Easy"],
  Redis: ["Easy"],
  SQL: ["Easy"],
  JavaScript: ["Easy", "Medium"],
  CSS: ["Easy", "Medium"],
};

// All possible difficulties (for alignment)
const allDifficulties: string[] = ["Easy", "Medium", "Hard"];

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopics,
  setSelectedTopics,
}) => {
  const handleDifficultyToggle = (topic: string, difficulty: string) => {
    setSelectedTopics((prev) => {
      const newMap = { ...prev };
      const currentDiffs = newMap[topic] || [];

      if (currentDiffs.includes(difficulty)) {
        const updated = currentDiffs.filter((d) => d !== difficulty);
        if (updated.length === 0) delete newMap[topic];
        else newMap[topic] = updated;
      } else {
        newMap[topic] = [...currentDiffs, difficulty];
      }
      return newMap;
    });
  };

  const handleTopicToggle = (topic: string, available: string[]) => {
    setSelectedTopics((prev) => {
      const newMap = { ...prev };
      const currentDiffs = newMap[topic] || [];

      if (currentDiffs.length === available.length) {
        // all selected → deselect all
        delete newMap[topic];
      } else {
        // select all available difficulties
        newMap[topic] = [...available];
      }
      return newMap;
    });
  };

  const handleSelectAll = () => {
    const fullSelection = Object.fromEntries(
      Object.entries(topics).map(([topic, diffs]) => [topic, [...diffs]]),
    );
    setSelectedTopics(fullSelection);
  };

  const handleDeselectAll = () => {
    setSelectedTopics({});
  };

  const isAllSelected =
    Object.keys(selectedTopics).length === Object.keys(topics).length;

  return (
    <div className="rounded-lg shadow-lg p-4">
      {/* Header row: title + select all button */}
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

      {/* Topics list */}
      <div className="space-y-4 overflow-y-auto h-[50vh] p-3">
        {Object.entries(topics).map(([topic, difficulties]) => {
          const selectedDiffs = selectedTopics[topic] || [];

          return (
            <div
              key={topic}
              className="flex items-center justify-between gap-4"
            >
              {/* Topic button */}
              <Button
                onClick={() => handleTopicToggle(topic, difficulties)}
                variant={
                  selectedDiffs.length === difficulties.length
                    ? "default"
                    : "outline"
                }
                className={`w-1/3 text-left ${
                  selectedDiffs.length === difficulties.length
                    ? "bg-orange-500 text-white"
                    : "text-black"
                } px-3 py-1`}
              >
                {topic}
              </Button>

              {/* Difficulty buttons */}
              <div className="w-2/3 flex flex-wrap gap-2 justify-between">
                {allDifficulties.map((diff) => {
                  const isAvailable = difficulties.includes(diff);
                  const isSelected = selectedDiffs.includes(diff);

                  return (
                    <Button
                      key={diff}
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      disabled={!isAvailable}
                      className={`w-30 text-center px-3 py-1 ${
                        isSelected
                          ? "bg-orange-500 text-white"
                          : !isAvailable
                            ? "opacity-50 cursor-not-allowed"
                            : "text-black border-white"
                      }`}
                      onClick={() =>
                        isAvailable && handleDifficultyToggle(topic, diff)
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
