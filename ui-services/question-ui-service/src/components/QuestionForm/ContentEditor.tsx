import React, { useEffect, useRef, useState } from "react";
import FormField from "./FormField";
import * as Quill from "quill";
import "quill/dist/quill.snow.css";
import "@/styles/quill.peerprep-theme";
import "@/styles/quill.peerprep-theme.css";

interface ContentEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  height?: string;
  maxHeight?: string;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  label = "Content (HTML allowed) *",
  value,
  onChange,
  error,
  height = "30vh",
  maxHeight = "60vh",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill.default | null>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlValue, setHtmlValue] = useState(value);

  // Initialize Quill once
  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    quillRef.current = new Quill.default(editorRef.current, {
      theme: "peerprep",
      modules: {
        toolbar: [
          ["bold", "italic", "underline", "strike"],
          ["link", "image"],
          ["clean"],
        ],
      },
      placeholder: "Enter the question description...",
    });

    const quill = quillRef.current;

    quill.root.style.fontFamily = "monospace";
    quill.root.style.height = "100%";
    quill.root.style.overflowY = "auto";

    // Load initial HTML
    quill.setContents(quill.clipboard.convert({ html: value }), "silent");

    // Sync Quill changes
    quill.on("text-change", () => {
      if (!isHtmlMode) {
        const html = quill.root.innerHTML;
        setHtmlValue(html);
        onChange(html);
      }
    });
  });

  // Sync external value when not typing in Quill
  useEffect(() => {
    if (!quillRef.current) return;

    if (!isHtmlMode && value !== quillRef.current.root.innerHTML) {
      quillRef.current.setContents(
        quillRef.current.clipboard.convert({ html: value }),
        "silent",
      );
    }
    setHtmlValue(value);
  }, [value, isHtmlMode]);

  const toggleMode = () => {
    if (!quillRef.current) return;

    if (!isHtmlMode) {
      // Enter HTML mode
      setHtmlValue(quillRef.current.root.innerHTML);
    } else {
      // Exit HTML mode: update Quill once
      quillRef.current.setContents(
        quillRef.current.clipboard.convert({ html: htmlValue }),
        "silent",
      );
      onChange(htmlValue);
    }

    setIsHtmlMode(!isHtmlMode);
  };

  return (
    <FormField label={label} error={error}>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          className={`px-3 py-1 rounded ${!isHtmlMode ? "bg-blue-600 text-white" : "bg-gray-600 text-gray-200"}`}
          onClick={() => !isHtmlMode || toggleMode()}
        >
          Editor
        </button>
        <button
          type="button"
          className={`px-3 py-1 rounded ${isHtmlMode ? "bg-blue-600 text-white" : "bg-gray-600 text-gray-200"}`}
          onClick={toggleMode}
        >
          HTML
        </button>
      </div>

      <div
        style={{ position: "relative", height, maxHeight }}
        className="rounded"
      >
        {/* Quill Editor */}
        <div
          ref={editorRef}
          className="bg-gray-700 text-white h-full w-full rounded"
        />

        {/* HTML overlay */}
        {isHtmlMode && (
          <textarea
            value={htmlValue}
            onChange={(e) => setHtmlValue(e.target.value)}
            onBlur={() => onChange(htmlValue)}
            className="absolute top-0 left-0 w-full p-2 border border-gray-700 bg-gray-800 text-white font-mono resize-none"
            style={{
              height: `calc(100% + 42px)`, // covers toolbar + editor
              boxSizing: "border-box",
            }}
          />
        )}
      </div>
    </FormField>
  );
};

export default ContentEditor;
