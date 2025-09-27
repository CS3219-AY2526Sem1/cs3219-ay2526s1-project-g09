import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { QuestionPreview } from "@/types/QuestionPreview";

interface QuestionPreviewCardProps {
  index: number;
  item: QuestionPreview;
}

const QuestionPreviewCard: React.FC<QuestionPreviewCardProps> = ({
  index,
  item,
}) => {
  return (
    <div key={index} className="flex items-center gap-4 w-full">
      <Card className="p-2 text-right font-bold text-gray-400 text-xl bg-gray-800 border border-gray-700">
        <CardContent className="gap-4 grid justify-center">
          {index + 1}
        </CardContent>
      </Card>
      <Card className="p-2 flex-1 text-gray-200 bg-gray-800 border border-gray-700">
        <CardContent className="grid grid-cols-4">
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
            <span className="text-md">{item.timeLimit}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionPreviewCard;
