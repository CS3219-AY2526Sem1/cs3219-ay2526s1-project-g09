import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { QuestionPreview } from "@/types/QuestionPreview";

interface QuestionCardProps {
  item: QuestionPreview;
  index: number;
  onClick?: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  item,
  index,
  onClick,
}) => {
  return (
    <div
      className="flex items-center gap-4 w-full cursor-pointer"
      onClick={onClick}
    >
      {/* Index Card */}
      <Card className="p-2 text-right font-bold text-gray-400 text-xl bg-gray-800 border border-gray-700">
        <CardContent className="grid justify-center">{index}</CardContent>
      </Card>

      {/* Question Info Card */}
      <Card className="p-2 flex-1 text-gray-200 bg-gray-800 border border-gray-700 hover:bg-gray-700">
        <CardContent className="grid grid-cols-4 gap-2">
          <div className="flex flex-col">
            <CardTitle className="text-lg text-orange-400">
              {item.questionName}
            </CardTitle>
          </div>
          <div className="flex flex-col">
            <span className="text-md">{item.topic}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-md">{item.difficulty}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-md">{item.timeLimit} min</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionCard;
