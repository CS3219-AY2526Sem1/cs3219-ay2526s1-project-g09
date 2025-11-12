import { Card, CardContent } from "@/components/ui/card";
import type { Attempt } from "@/types/Attempt";

interface AttemptCardProps {
  index: number;
  item: Attempt;
  onClick?: () => void;
}

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatTime = (date: Date) =>
  date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.valueOf());

const AttemptCard: React.FC<AttemptCardProps> = ({ index, item, onClick }) => {
  const timeTakenLabel =
    typeof item.timeTaken === "number"
      ? `${item.timeTaken} min`
      : (item.timeTaken ?? "—");

  const dateLabel = isValidDate(item.date) ? formatDate(item.date) : "—";
  const timeLabel = isValidDate(item.date) ? formatTime(item.date) : "—";

  return (
    <div
      className="flex items-center gap-4 w-full cursor-pointer"
      onClick={onClick}
    >
      {/* Index Card */}
      <Card className="p-2 text-right font-bold text-gray-400 text-xl bg-gray-800 border border-gray-700">
        <CardContent className="grid justify-center">{index + 1}</CardContent>
      </Card>

      {/* Attempt Info Card */}
      <Card className="p-2 flex-1 text-gray-200 bg-gray-800 border border-gray-700 hover:bg-gray-700">
        <CardContent className="grid grid-cols-4 gap-2">
          <span className="text-gray-300">{dateLabel}</span>
          <span className="text-gray-300">{timeLabel}</span>
          <span className="text-gray-300">{item.partner || "—"}</span>
          <span className="text-gray-300">{timeTakenLabel}</span>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttemptCard;
