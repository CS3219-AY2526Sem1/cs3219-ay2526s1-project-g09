import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { HistoryEntry } from "@/types/HistoryEntry";

interface QuestionCardProps {
  index: number;
  item: HistoryEntry;
  onClick?: () => void;
}

const QuestionCard = ({ index, item, onClick }: QuestionCardProps) => {
  const topicLabel =
    item.topics.length > 0 ? item.topics.join(", ") : "No tagged topics";
  const timeLabel =
    typeof item.timeLimit === "number" ? `${item.timeLimit} min` : "—";

  return (
    <div
      className="flex items-center gap-4 w-full cursor-pointer"
      onClick={onClick}
    >
      {/* Index Card */}
      <Card className="p-2 text-right font-bold text-gray-400 text-xl bg-gray-800 border border-gray-700">
        <CardContent className="grid justify-center">{index + 1}</CardContent>
      </Card>
      <Card className="p-2 flex-1 text-gray-200 bg-gray-800 border border-gray-700 hover:bg-gray-700">
        <CardContent className="grid grid-cols-4 gap-2">
          <div className="flex flex-col">
            <CardTitle className="text-lg text-orange-400">
              {item.questionTitle || "Untitled Question"}
            </CardTitle>
          </div>
          <div className="flex flex-col">
            <span className="text-md">{topicLabel}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-md">{item.difficulty ?? "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-md">{timeLabel}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionCard;
