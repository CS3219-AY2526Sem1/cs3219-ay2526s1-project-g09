import React, { useCallback, useEffect, useState } from "react";
import HistoryTable from "@/components/QuestionTable/QuestionHistoryTable";
import type { HistoryEntry } from "@/types/HistoryEntry";
import { fetchHistoryEntries } from "@/api/historyService";
import "./index.css";

export interface HistoryAppProps {
  userId?: string;
  allowUserFilter?: boolean;
  renderQuestionPanel?: boolean;
  onEntrySelect?: (entry: HistoryEntry | null) => void;
  selectedEntryId?: string;
}

const DEFAULT_FILTER_ENABLED = true;

const HistoryApp: React.FC<HistoryAppProps> = ({
  userId,
  allowUserFilter,
  renderQuestionPanel = true,
  onEntrySelect,
  selectedEntryId: controlledSelectedId,
}) => {
  const filterEnabled = allowUserFilter ?? DEFAULT_FILTER_ENABLED;

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedUserId, setSubmittedUserId] = useState<string | undefined>(
    () => (userId?.trim() ? userId.trim() : undefined),
  );
  const [internalSelectedId, setInternalSelectedId] = useState<
    string | undefined
  >(controlledSelectedId);

  const isControlledSelection = controlledSelectedId !== undefined;
  const selectedId = isControlledSelection
    ? controlledSelectedId
    : internalSelectedId;

  const loadHistory = useCallback(
    async (abortSignal: AbortSignal, userId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchHistoryEntries({
          userId: userId?.trim() ? userId.trim() : undefined,
          signal: abortSignal,
        });
        setEntries(items);
      } catch (err) {
        if (!abortSignal.aborted) {
          const message =
            err instanceof Error ? err.message : "Failed to load history";
          setError(message);
          setEntries([]);
        }
      } finally {
        if (!abortSignal.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof userId === "string") {
      const trimmed = userId.trim();
      setSubmittedUserId(trimmed || undefined);
    } else if (!filterEnabled) {
      setSubmittedUserId(undefined);
    }
  }, [userId, filterEnabled]);

  useEffect(() => {
    if (!filterEnabled && !submittedUserId) {
      setEntries([]);
      setError("No user specified. Sign in to view your history.");
      if (!isControlledSelection) {
        setInternalSelectedId(undefined);
      }
      onEntrySelect?.(null);
      return;
    }

    const controller = new AbortController();
    void loadHistory(controller.signal, submittedUserId);
    return () => controller.abort();
  }, [
    filterEnabled,
    loadHistory,
    submittedUserId,
    isControlledSelection,
    onEntrySelect,
  ]);

  useEffect(() => {
    if (isControlledSelection) {
      setInternalSelectedId(controlledSelectedId);
    }
  }, [controlledSelectedId, isControlledSelection]);

  useEffect(() => {
    if (entries.length === 0) {
      if (!isControlledSelection) {
        setInternalSelectedId(undefined);
      }
      if (renderQuestionPanel || isControlledSelection) {
        onEntrySelect?.(null);
      }
      return;
    }

    let nextId = selectedId;
    if (!nextId || !entries.some((entry) => entry.id === nextId)) {
      if (renderQuestionPanel || isControlledSelection) {
        nextId = entries[0].id;
        if (!isControlledSelection) {
          setInternalSelectedId(nextId);
        }
      }
    }

    const entry = entries.find((item) => item.id === nextId) ?? null;
    if (renderQuestionPanel || isControlledSelection) {
      onEntrySelect?.(entry);
    }
  }, [
    entries,
    selectedId,
    isControlledSelection,
    onEntrySelect,
    renderQuestionPanel,
  ]);

  const handleRowSelect = (entry: HistoryEntry) => {
    if (!isControlledSelection) {
      setInternalSelectedId(entry.id);
    }
    onEntrySelect?.(entry);
  };

  return (
    <div className="min-h-80 text-slate-100">
      {renderQuestionPanel ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
          <HistoryTable
            items={entries}
            isLoading={loading}
            error={error}
            selectedId={selectedId}
            onSelect={handleRowSelect}
            onRetry={() => {
              const controller = new AbortController();
              void loadHistory(controller.signal, submittedUserId);
            }}
          />
        </div>
      ) : (
        <div>
          <HistoryTable
            items={entries}
            isLoading={loading}
            error={error}
            selectedId={selectedId}
            onSelect={handleRowSelect}
            onRetry={() => {
              const controller = new AbortController();
              void loadHistory(controller.signal, submittedUserId);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default HistoryApp;
