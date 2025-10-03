import { Checkbox } from "@/components/ui/checkbox";

interface TopicSelectorProps {
  selectedTopics: string[];
  setSelectedTopics: React.Dispatch<React.SetStateAction<string[]>>;
}

const topics = ["OOP", "Database", "Algorithm", "AI", "Python", "Java", "Ruby"];

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopics,
  setSelectedTopics,
}) => {
  const handleToggle = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedTopics(checked ? topics : []);
  };

  return (
    <div className="rounded-lg shadow-lg">
      <h1 className="text-start text-4xl font-semibold mb-4">
        Question Preferences
      </h1>
      <div className="flex items-center mb-4">
        <Checkbox
          checked={selectedTopics.length === topics.length}
          onCheckedChange={(checked) => handleSelectAll(!!checked)}
          className="mr-2"
        />
        <span>Select All</span>
      </div>
      <div className="space-y-2 w-[20vw] h-[30vh] overflow-y-auto p-3">
        {topics.map((topic) => (
          <div
            key={topic}
            onClick={() => handleToggle(topic)}
            className={`p-4 rounded-md cursor-pointer transition-colors duration-200 ${
              selectedTopics.includes(topic)
                ? "bg-orange-500 text-white"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
          >
            {topic}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicSelector;
