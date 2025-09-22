import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface QuestionPreferencesProps {
  onConfirm: () => void;
}

const QuestionPreferences: React.FC<QuestionPreferencesProps> = ({
  onConfirm,
}) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "Easy" | "Medium" | "Hard"
  >("Easy");
  const [timeMin, setTimeMin] = useState<string>("");
  const [timeMax, setTimeMax] = useState<string>("");

  const topics = [
    "OOP",
    "Database",
    "Algorithm",
    "AI",
    "Python",
    "Java",
    "Ruby",
  ];

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTopics(topics);
    } else {
      setSelectedTopics([]);
    }
  };

  const handleConfirm = () => {
    console.log("Preferences:", {
      selectedTopics,
      selectedDifficulty,
      timeMin,
      timeMax,
    });
    console.log("Preferences confirmed");
    onConfirm(); // Call the prop function
  };

  return (
    <div className="text-white p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Topics and Select All */}
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
            {topics.map((topic, index) => (
              <div
                key={index}
                onClick={() => handleTopicToggle(topic)}
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

        {/* Difficulty and Time Limit */}
        <div className="space-y-8 text-start">
          {/* Difficulty */}
          <div>
            <h2 className="text-3xl font-semibold mb-2">Difficulty</h2>
            <div className="flex gap-4 justify-start">
              {["Easy", "Medium", "Hard"].map((difficulty) => (
                <Button
                  key={difficulty}
                  variant={
                    selectedDifficulty === difficulty ? "default" : "outline"
                  }
                  onClick={() =>
                    setSelectedDifficulty(
                      difficulty as "Easy" | "Medium" | "Hard",
                    )
                  }
                  className={`${
                    selectedDifficulty === difficulty
                      ? "bg-orange-600 text-white"
                      : "text-black"
                  }`}
                >
                  {difficulty}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Limit */}

          <div>
            <h2 className="text-3xl font-semibold mb-2">Time Limit</h2>
            <div className="text-gray-400 text-sm mb-2">
              Min: 10m &nbsp; Max: 2h
            </div>
            <div className="flex items-start gap-2 justify-start">
              <Input
                type="text"
                placeholder="H:MM"
                value={timeMin}
                onChange={(e) => setTimeMin(e.target.value)}
                className="w-24 bg-white"
              />
              <span className="text-lg">-</span>
              <Input
                type="text"
                placeholder="H:MM"
                value={timeMax}
                onChange={(e) => setTimeMax(e.target.value)}
                className="w-24 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="mt-8">
        <Button
          onClick={handleConfirm}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6"
        >
          Confirm Preferences!
        </Button>
      </div>
    </div>
  );
};

export default QuestionPreferences;
