import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "@components/layout/BlueBgLayout";
import type { HistorySnapshot } from "@/types/history";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";
import type { Attempt } from "@/types/Attempt";
import type { Question } from "@/types/Question";
import {
  fetchHistorySnapshot,
  fetchHistorySnapshots,
  normaliseHistorySnapshot,
} from "@/api/historyService";

interface LocationState {
  entry?: HistorySnapshot | Record<string, unknown>;
}

type RemoteQuestionAttemptTableProps = {
  items?: Attempt[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelect?: (attempt: Attempt) => void;
  title?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  listClassName?: string;
};

const HistoryDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { historyId } = useParams<{ historyId: string }>();
  const location = useLocation();

  const initialEntry = useMemo(() => {
    const state = location.state as LocationState | undefined;
    if (!state?.entry) {
      return null;
    }
    return normaliseHistorySnapshot(state.entry) ?? null;
  }, [location.state]);

  const [entry, setEntry] = useState<HistorySnapshot | null>(initialEntry);
  const [loading, setLoading] = useState(!initialEntry);
  const [error, setError] = useState<string | null>(null);
  const [attemptSnapshots, setAttemptSnapshots] = useState<HistorySnapshot[]>(
    initialEntry ? [initialEntry] : [],
  );
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);

  useEffect(() => {
    if (entry || !historyId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetchHistorySnapshot(historyId, controller.signal)
      .then((snapshot) => {
        setEntry(snapshot);
        setError(null);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          const message =
            err instanceof Error ? err.message : "Failed to load history";
          setError(message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [entry, historyId]);

  useEffect(() => {
    if (!entry) {
      setAttemptSnapshots([]);
      return;
    }
    setAttemptSnapshots([entry]);
    setAttemptsError(null);
  }, [entry]);

  useEffect(() => {
    if (!entry?.userId || !entry?.questionId) {
      return;
    }

    const controller = new AbortController();
    setAttemptsLoading(true);
    fetchHistorySnapshots(
      {
        userId: entry.userId,
        questionId: entry.questionId,
        limit: 100,
      },
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }

        if (!result.items.length) {
          setAttemptSnapshots(entry ? [entry] : []);
        } else {
          const map = new Map<string, HistorySnapshot>();
          result.items.forEach((snapshot) => map.set(snapshot.id, snapshot));
          if (entry && !map.has(entry.id)) {
            map.set(entry.id, entry);
          }
          setAttemptSnapshots(Array.from(map.values()));
        }
        setAttemptsError(null);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setAttemptsError(
            err instanceof Error ? err.message : "Failed to load attempts",
          );
          setAttemptSnapshots(entry ? [entry] : []);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAttemptsLoading(false);
        }
      });

    return () => controller.abort();
  }, [entry]);

  const attemptEntries = useMemo<Attempt[]>(() => {
    if (!attemptSnapshots.length) {
      return [];
    }

    const sortedSnapshots = [...attemptSnapshots].sort((a, b) => {
      const timeA =
        (a.sessionEndedAt ?? a.updatedAt ?? a.createdAt)?.getTime() ?? 0;
      const timeB =
        (b.sessionEndedAt ?? b.updatedAt ?? b.createdAt)?.getTime() ?? 0;
      return timeB - timeA;
    });

    return sortedSnapshots.map((snapshot) => {
      const attemptTimestamp =
        snapshot.sessionEndedAt ??
        snapshot.updatedAt ??
        snapshot.createdAt ??
        new Date();

      const timeTakenLabel = formatDuration(snapshot);

      const baseQuestion: Question = {
        title: snapshot.questionTitle || "Untitled Question",
        body: "",
        topics: snapshot.topics ?? [],
        hints: [],
        answer: "",
        difficulty: snapshot.difficulty ?? "Unknown",
        timeLimit:
          typeof snapshot.timeLimit === "number"
            ? `${snapshot.timeLimit} min`
            : snapshot.timeLimit !== undefined
              ? String(snapshot.timeLimit)
              : "—",
      };

      const partner =
        snapshot.participants.find(
          (participant) => participant !== snapshot.userId,
        ) ?? snapshot.userId;

      return {
        id: snapshot.id,
        question: baseQuestion,
        date: attemptTimestamp,
        partner,
        timeTaken: timeTakenLabel,
      };
    });
  }, [attemptSnapshots]);

  const handleAttemptSelect = (attempt: Attempt) => {
    if (!attempt?.id) {
      return;
    }

    const snapshot = attemptSnapshots.find((item) => item.id === attempt.id);
    if (!snapshot) {
      return;
    }

    const attemptPartner =
      attempt.partner ??
      snapshot.participants.find(
        (participant) => participant !== snapshot.userId,
      ) ??
      snapshot.userId;

    navigate(`/history/${snapshot.id}/attempt`, {
      state: {
        entry: snapshot,
        attemptPartner,
      },
    });
  };

  const handleBack = () => {
    navigate(`/history`);
  };

  return (
    <Layout>
      <div className="flex h-[85vh] gap-4 px-4">
        <div className="flex w-1/2 flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1 text-sm text-slate-200 transition-colors hover:bg-slate-800"
            >
              ← Back
            </button>
          </div>

          <div className="overflow-y-auto">
            <RemoteWrapper
              remote={() => import("questionUiService/QuestionDisplay")}
              remoteName="Question UI Service"
              remoteProps={entry ? { questionId: entry.questionId } : undefined}
              loadingMessage="Loading Question..."
              errorMessage="Question Display service unavailable"
            />
          </div>
        </div>

        <div className="flex w-1/2 flex-col">
          <RemoteWrapper<RemoteQuestionAttemptTableProps>
            remote={() => import("historyUiService/QuestionAttemptTable")}
            remoteName="History UI Service"
            loadingMessage="Loading attempt history…"
            errorMessage="Attempt history unavailable."
            remoteProps={{
              items: attemptEntries,
              isLoading: loading || attemptsLoading,
              error: error ?? attemptsError,
              emptyMessage: "No attempt history recorded.",
              loadingMessage: "Loading attempt history…",
              onSelect: handleAttemptSelect,
              listClassName: "min-h-[24rem]",
            }}
          />
        </div>
      </div>
    </Layout>
  );
};

function formatDuration(
  entry: Pick<
    HistorySnapshot,
    "durationMs" | "sessionEndedAt" | "sessionStartedAt" | "createdAt"
  >,
): string {
  const explicitDuration =
    typeof entry.durationMs === "number" && entry.durationMs >= 0
      ? entry.durationMs
      : undefined;

  const startedAt = entry.sessionStartedAt ?? entry.createdAt;
  const endedAt = entry.sessionEndedAt;

  const inferredDuration =
    startedAt && endedAt
      ? Math.max(0, endedAt.getTime() - startedAt.getTime())
      : undefined;

  const durationMs = explicitDuration ?? inferredDuration;
  if (durationMs === undefined) {
    return "—";
  }

  return formatMilliseconds(durationMs);
}

function formatMilliseconds(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export default HistoryDetailPage;
