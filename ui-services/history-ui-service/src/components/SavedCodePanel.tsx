import React, { useMemo } from "react";
import Editor from "@monaco-editor/react";

export interface SavedCodePanelProps {
  code: string;
  onCodeChange?: (value: string | undefined) => void;
  language?: string;
  loading?: boolean;
  error?: string | null;
  isSaving?: boolean;
  saveError?: string | null;
  hasSnapshot?: boolean;
  title?: string;
  hasUnsavedChanges?: boolean;
}

const SavedCodePanel: React.FC<SavedCodePanelProps> = ({
  code,
  onCodeChange,
  language,
  loading = false,
  isSaving = false,
  saveError = null,
  hasSnapshot = true,
  title = "Saved Code",
  hasUnsavedChanges = false,
}) => {
  const editorValue = typeof code === "string" ? code : "";

  const editorLanguage = useMemo(() => {
    if (!language) {
      return "plaintext";
    }
    const normalized = language.trim().toLowerCase();
    const languageMap: Record<string, string> = {
      js: "javascript",
      javascript: "javascript",
      ts: "typescript",
      typescript: "typescript",
      py: "python",
      python: "python",
      c: "c",
      cpp: "cpp",
      "c++": "cpp",
      java: "java",
      go: "go",
      rust: "rust",
    };
    return languageMap[normalized] ?? normalized;
  }, [language]);

  const statusMessage = (() => {
    if (loading) {
      return "Loading…";
    }
    if (!hasSnapshot) {
      return "No snapshot selected.";
    }
    if (saveError) {
      return saveError;
    }
    if (isSaving) {
      return "Saving changes…";
    }
    if (hasUnsavedChanges) {
      return "Unsaved changes";
    }
    return "All changes saved.";
  })();

  return (
    <div className="flex h-[55%] flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900/70">
      <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
        {title}
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          value={editorValue}
          onChange={onCodeChange}
          language={editorLanguage}
          theme="vs-dark"
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            readOnly: false,
            wordWrap: "on",
            fontSize: 14,
          }}
          height="100%"
        />
      </div>
      <div className="border-t border-slate-800 bg-slate-950/60 px-4 py-2 text-xs text-slate-400">
        {saveError ? (
          <span className="text-red-400">{statusMessage}</span>
        ) : (
          statusMessage
        )}
      </div>
    </div>
  );
};

export default SavedCodePanel;
