import React from "react";
import AttemptCard from "./AttemptCard";
import { PaginatedHistoryList } from "../PaginatedHistoryList";
import type { Attempt } from "@/types/Attempt";
import { mockAttempts } from "@/data/mock-history-data";

const AttemptHistoryHeader = () => (
  <div className="flex items-center gap-4 px-2 text-sm font-semibold text-slate-300">
    <div className="w-16 text-center">No.</div>
    <div className="flex-1 grid grid-cols-4 gap-4 px-4">
      <span>Date</span>
      <span>Time</span>
      <span>Partner</span>
      <span>Time Taken</span>
    </div>
  </div>
);

export interface QuestionAttemptTableProps {
  items?: Attempt[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelect?: (attempt: Attempt) => void;
  title?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  listClassName?: string;
}

const QuestionAttemptTable: React.FC<QuestionAttemptTableProps> = ({
  items = mockAttempts,
  isLoading = false,
  error = null,
  onRetry,
  onSelect,
  title = "Attempt History",
  emptyMessage = "No attempts recorded yet.",
  loadingMessage = "Loading attempts…",
  listClassName = "min-h-[60vh]",
}) => {
  const getKey = (attempt: Attempt, fallback: number) => {
    if (attempt.id) {
      return attempt.id;
    }
    const partnerPart = attempt.partner ?? "unknown-partner";
    const datePart =
      attempt.date instanceof Date && !Number.isNaN(attempt.date.valueOf())
        ? attempt.date.toISOString()
        : `no-date-${fallback}`;
    return `${partnerPart}-${datePart}-${fallback}`;
  };

  return (
    <PaginatedHistoryList<Attempt>
      items={items}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onSelect={onSelect}
      title={title}
      emptyMessage={emptyMessage}
      loadingMessage={loadingMessage}
      header={<AttemptHistoryHeader />}
      listClassName={listClassName}
      getItemKey={(attempt, index) => getKey(attempt, index)}
      renderItem={({ item, globalIndex, onSelect: handleSelect }) => (
        <AttemptCard index={globalIndex} item={item} onClick={handleSelect} />
      )}
    />
  );
};

export default QuestionAttemptTable;
