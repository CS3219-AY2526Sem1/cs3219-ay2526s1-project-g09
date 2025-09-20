import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { Attempt } from "@/types/Attempt";

interface QuestionHistoryCardProps {
  index: number;
  item: Attempt;
}

const QuestionHistoryCard: React.FC<QuestionHistoryCardProps> = ({ index, item }) => {
  return (
    <div key={index} className="flex items-center gap-4 w-full">
      <Card className="p-2 flex-1 text-gray-200 bg-gray-800 border border-gray-700">
        <CardContent className="grid grid-cols-4">
          <div className="flex flex-col">
            <CardTitle className="text-lg text-orange-400">
              {item.date.toISOString()}
            </CardTitle>
          </div>
          <div className="flex flex-col">
            <span className="text-md">{item.date.getTime()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-md">{item.partner}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-md">{item.timeTaken}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionHistoryCard;
