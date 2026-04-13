"use client";
import { useState, useRef } from "react";
import { uploadPaper, Paper } from "@/lib/api";

interface Props {
  onUploaded: (paper: Paper) => void;
}

export default function UploadForm({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    console.log("📄 FILE SELECTED:", file); // 🔥 DEBUG

    if (!file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      console.log("🚀 Sending to backend..."); // 🔥 DEBUG

      const paper = await uploadPaper(file);

      console.log("✅ RESPONSE FROM BACKEND:", paper); // 🔥 DEBUG

      setSuccess(`✓ "${paper.title || file.name}" analyzed and saved.`);
      onUploaded(paper);
    } catch (err: any) {
      console.error("❌ UPLOAD ERROR:", err); // 🔥 DEBUG

      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      
      <label className="block cursor-pointer">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors
            ${dragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500"}
            ${loading ? "opacity-60 pointer-events-none" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="text-4xl mb-3">📄</div>

          {loading ? (
            <div>
              <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Extracting & analyzing with Gemini...
              </div>
              <p className="text-sm text-gray-500 mt-1">This may take 10–20 seconds</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                Drop a PDF here, or click to browse
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Max 20 MB · PDF only
              </p>
            </>
          )}
        </div>
      </label>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          {success}
        </div>
      )}
    </div>
  );
}