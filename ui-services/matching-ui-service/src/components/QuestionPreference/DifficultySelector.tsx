import { Button } from "@/components/ui/button";

interface DifficultySelectorProps {
  selectedDifficulties: string[];
  setSelectedDifficulties: React.Dispatch<React.SetStateAction<string[]>>;
}

const difficulties = ["Easy", "Medium", "Hard"];

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedDifficulties,
  setSelectedDifficulties,
}) => {
  const handleToggle = (difficulty: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty],
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold mb-2">Difficulty</h2>
      <div className="flex gap-4 justify-start">
        {difficulties.map((difficulty) => (
          <Button
            key={difficulty}
            variant={
              selectedDifficulties.includes(difficulty) ? "default" : "outline"
            }
            onClick={() => handleToggle(difficulty)}
            className={`${
              selectedDifficulties.includes(difficulty)
                ? "bg-orange-600 text-white"
                : "text-black"
            }`}
          >
            {difficulty}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;
