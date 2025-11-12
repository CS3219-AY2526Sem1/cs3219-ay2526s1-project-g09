import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import PaginationBar from "./PaginationBar";

const DEFAULT_ITEMS_PER_PAGE = 8;

interface RenderItemArgs<T> {
  item: T;
  pageIndex: number;
  globalIndex: number;
  isActive: boolean;
  onSelect?: () => void;
}

export interface PaginatedHistoryListProps<T> {
  items: T[];
  renderItem: (args: RenderItemArgs<T>) => ReactNode;
  itemsPerPage?: number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelect?: (item: T) => void;
  isItemActive?: (item: T) => boolean;
  getItemKey?: (item: T, globalIndex: number) => React.Key;
  title?: string;
  header?: ReactNode;
  emptyMessage?: string;
  loadingMessage?: string;
  containerClassName?: string;
  listClassName?: string;
}

export function PaginatedHistoryList<T>({
  items,
  renderItem,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  isLoading = false,
  error = null,
  onRetry,
  onSelect,
  isItemActive,
  getItemKey,
  title = "History Records",
  header,
  emptyMessage = "No records found.",
  loadingMessage = "Loading…",
}: PaginatedHistoryListProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const totalItems = items.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / itemsPerPage)),
    [itemsPerPage, totalItems],
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = useMemo(
    () => items.slice(startIndex, startIndex + itemsPerPage),
    [items, startIndex, itemsPerPage],
  );

  const showEmptyState = !isLoading && !error && totalItems === 0;
  const shouldShowList = !isLoading && !error && !showEmptyState;

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg p-6">
      <div className="flex items-center gap-4 text-sm text-slate-400">
        {title ? (
          <span className="mr-auto text-xs uppercase tracking-widest text-slate-500">
            {title}
          </span>
        ) : (
          <span className="mr-auto" />
        )}
        {shouldShowList && (
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalQuestions={totalItems}
            itemsPerPage={itemsPerPage}
            loading={isLoading}
            onNext={handleNextPage}
            onPrevious={handlePreviousPage}
          />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          <span>{error}</span>
          {onRetry && (
            <Button size="sm" variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          {loadingMessage}
        </div>
      )}

      {showEmptyState && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          {emptyMessage}
        </div>
      )}

      {shouldShowList && header}

      {shouldShowList && (
        <div className="flex flex-col gap-4 overflow-y-auto">
          {currentItems.map((item, index) => {
            const globalIndex = startIndex + index;
            const key = getItemKey?.(item, globalIndex) ?? globalIndex;
            const handleSelect = onSelect ? () => onSelect(item) : undefined;
            const isActive = isItemActive?.(item) ?? false;

            return (
              <React.Fragment key={key}>
                {renderItem({
                  item,
                  pageIndex: index,
                  globalIndex,
                  isActive,
                  onSelect: handleSelect,
                })}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
