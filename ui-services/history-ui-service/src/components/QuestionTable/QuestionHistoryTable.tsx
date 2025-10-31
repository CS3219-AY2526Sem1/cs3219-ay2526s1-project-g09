import React from "react";
import QuestionCard from "@/components/QuestionTable/QuestionCard";
import type { HistoryEntry } from "@/types/HistoryEntry";
import { PaginatedHistoryList } from "../PaginatedHistoryList";

export interface HistoryTableProps {
  items: HistoryEntry[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectedId?: string;
  onSelect?: (entry: HistoryEntry) => void;
}

const QuestionHistoryHeader = () => (
  <div className="p-2 flex items-center gap-4 font-bold">
    <div className="w-15 grid justify-center">No.</div>
    <div className="px-10 flex-1 grid grid-cols-4 gap-4">
      <span>Question</span>
      <span>Category</span>
      <span>Difficulty</span>
      <span>Time Limit</span>
    </div>
  </div>
);

const QuestionHistoryTable: React.FC<HistoryTableProps> = ({
  items,
  isLoading = false,
  error = null,
  onRetry,
  selectedId,
  onSelect,
}) => {
  return (
    <PaginatedHistoryList
      items={items}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onSelect={onSelect}
      isItemActive={(entry) => entry.id === selectedId}
      getItemKey={(entry) => entry.id}
      emptyMessage="No history snapshots found for this filter."
      loadingMessage="Loading history…"
      header={<QuestionHistoryHeader />}
      listClassName="min-h-[60vh]"
      renderItem={({ item, globalIndex, onSelect: handleSelect }) => (
        <QuestionCard index={globalIndex} item={item} onClick={handleSelect} />
      )}
    />
  );
};

export default QuestionHistoryTable;
