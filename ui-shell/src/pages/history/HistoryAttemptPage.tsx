import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";
import Layout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import { Button } from "@/components/ui/button";
import type { HistorySnapshot } from "@/types/history";
import {
  fetchHistorySnapshot,
  normaliseHistorySnapshot,
  updateHistorySnapshot,
} from "@/api/historyService";

interface LocationState {
  entry?: HistorySnapshot | Record<string, unknown>;
}

const HistoryAttemptPage: React.FC = () => {
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
  const [codeDraft, setCodeDraft] = useState<string>(initialEntry?.code ?? "");
  const [lastSavedCode, setLastSavedCode] = useState<string>(
    initialEntry?.code ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const entryRef = useRef<HistorySnapshot | null>(initialEntry);

  useEffect(() => {
    entryRef.current = entry;
  }, [entry]);

  useEffect(() => {
    if (entry || !historyId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetchHistorySnapshot(historyId, controller.signal)
      .then((snapshot) => {
        setEntry(snapshot);
        setCodeDraft(snapshot?.code ?? "");
        setLastSavedCode(snapshot?.code ?? "");
        entryRef.current = snapshot;
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
      setCodeDraft("");
      setLastSavedCode("");
      entryRef.current = null;
      return;
    }

    setCodeDraft(entry.code ?? "");
    setLastSavedCode(entry.code ?? "");
    entryRef.current = entry;
  }, [entry]);

  const handleCodeChange = useCallback((value?: string) => {
    const nextValue = value ?? "";
    setCodeDraft(nextValue);
    if (entryRef.current) entryRef.current.code = nextValue;
    setSaveError(null);
  }, []);

  const loadSavedCodePanel = useMemo(
    () => () => import("historyUiService/SavedCodePanel"),
    [],
  );

  const savedCodePanelProps = useMemo(
    () => ({
      code: codeDraft,
      onCodeChange: handleCodeChange,
      language: entry?.language,
      loading,
      error,
      isSaving,
      saveError,
      hasSnapshot: Boolean(entry),
      title: "Saved Code",
      hasUnsavedChanges: codeDraft !== lastSavedCode,
    }),
    [
      codeDraft,
      handleCodeChange,
      loading,
      error,
      isSaving,
      saveError,
      entry,
      lastSavedCode,
    ],
  );

  const persistCode = useCallback(async (): Promise<HistorySnapshot | null> => {
    if (!entry?.id) {
      return null;
    }
    if (codeDraft === lastSavedCode) {
      return entry;
    }

    const trimmed = codeDraft.trim();
    if (trimmed.length === 0) {
      setSaveError("Code cannot be empty.");
      setCodeDraft(lastSavedCode);
      setEntry((current) => {
        const nextEntry = current
          ? { ...current, code: lastSavedCode }
          : current;
        entryRef.current = nextEntry;
        return nextEntry;
      });
      return null;
    }

    try {
      setIsSaving(true);
      const updated = await updateHistorySnapshot(entry.id, {
        code: codeDraft,
        language: entry.language,
      });
      setEntry(updated);
      setCodeDraft(updated.code ?? codeDraft);
      setLastSavedCode(updated.code ?? codeDraft);
      entryRef.current = updated;
      setSaveError(null);
      return updated;
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save code snapshot",
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [codeDraft, entry, lastSavedCode]);

  const handleBack = () => {
    const currentEntry = entryRef.current;
    if (!currentEntry?.id) {
      navigate(-1);
      return;
    }

    void (async () => {
      const latest = await persistCode();
      const snapshot = latest ?? entryRef.current ?? currentEntry;
      navigate(`/history/${snapshot.id}`, {
        replace: true,
        state: { entry: snapshot },
      });
    })();
  };

  return (
    <Layout navHeader={<NavHeader />}>
      <div className="flex items-center justify-between pl-4 mb-4">
        <button
          type="button"
          onClick={handleBack}
          className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1 text-sm text-slate-200 transition-colors hover:bg-slate-800"
        >
          ← Back
        </button>
      </div>
      <div className="flex h-[85vh] gap-4 px-4">
        <div className="flex-1 overflow-y-auto">
          <RemoteWrapper
            remote={() => import("questionUiService/QuestionDisplay")}
            remoteName="Question UI Service"
            remoteProps={entry ? { questionId: entry.questionId } : undefined}
            loadingMessage="Loading Question..."
            errorMessage="Question Display service unavailable"
          />
        </div>

        <div className="flex-1 rounded-lg ">
          <RemoteWrapper
            remote={loadSavedCodePanel}
            remoteName="History UI Service"
            loadingMessage="Loading saved code…"
            errorMessage="Saved code panel unavailable."
            remoteProps={savedCodePanelProps}
          />
          <div className="flex justify-end mt-4">
            <Button
              type="button"
              onClick={() => {
                void persistCode();
              }}
              disabled={isSaving || codeDraft === lastSavedCode}
            >
              {isSaving ? "Saving..." : "Save Code"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default HistoryAttemptPage;
