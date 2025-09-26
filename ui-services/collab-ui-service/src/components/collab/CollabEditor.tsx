import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import io from "socket.io-client";

const socket = io("http://localhost:5276");

interface CollabEditorProps {
  questionId: string;
  users: string[];
}

const CollabEditor: React.FC<CollabEditorProps> = ({ questionId, users }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [code, setCode] = useState("// Start coding here!\n");

  useEffect(() => {
    const init = async () => {
      console.log(
        "Creating session for question:",
        questionId,
        "users:",
        users,
      );
      const res = await fetch("http://localhost:5276/api/collab/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, users }),
      });
      const data = await res.json();
      setSessionId(data.session.sessionId);

      socket.emit("joinRoom", data.session.sessionId);
    };

    init();
  }, [questionId, users]);

  useEffect(() => {
    if (!sessionId) return;

    socket.on("codeUpdate", (newCode: string) => {
      setCode(newCode);
    });

    return () => {
      socket.off("codeUpdate");
    };
  }, [sessionId]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && sessionId) {
      setCode(value);
      socket.emit("codeUpdate", { sessionId, newCode: value });
    }
  };

  return (
    <Editor
      height="100%"
      defaultLanguage="java"
      value={code}
      theme="vs-dark"
      onChange={handleEditorChange}
      options={{ minimap: { enabled: false } }}
    />
  );
};

export default CollabEditor;
