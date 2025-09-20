import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Editor from "@monaco-editor/react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

const WorkingWindow: React.FC = () => {
  // State to hold the code content
  const [code, setCode] = useState<string>(
    "// Start coding here!\nfunction twoSum(nums, target) {\n    \n}"
  );

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  return (
    <div className="flex flex-1 bg-gray-800 rounded-lg shadow-md overflow-hidden relative">
      <Tabs defaultValue="code" className="flex flex-col flex-1">
        <TabsList className="absolute top-4 right-4 z-10 bg-gray-700 rounded-lg shadow-md">
          <TabsTrigger
            value="code"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Code
          </TabsTrigger>
          <TabsTrigger
            value="whiteboard"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Whiteboard
          </TabsTrigger>
        </TabsList>
        <TabsContent value="code" className="flex-1 p-4 overflow-hidden">
          {/* The Monaco Editor component */}
          <Editor
            height="100%"
            defaultLanguage="javascript"
            defaultValue={code}
            theme="vs-dark"
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
            }}
          />
        </TabsContent>
        <TabsContent value="whiteboard" className="flex-1 p-4 overflow-hidden">
          <Tldraw />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkingWindow;
