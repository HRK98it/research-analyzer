"use client";
import { useState, useRef } from "react";
import { uploadPaper, Paper } from "@/lib/api";

interface Props {
  onUploaded: (paper: Paper) => void;
}

interface FileStatus {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  result?: Paper;
  error?: string;
}

export default function UploadForm({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateStatus = (index: number, update: Partial<FileStatus>) => {
    setFileStatuses(prev =>
      prev.map((f, i) => i === index ? { ...f, ...update } : f)
    );
  };

  const handleFiles = async (files: File[]) => {
    const pdfs = files.filter(f => f.name.endsWith(".pdf"));
    if (pdfs.length === 0) return;

    const statuses: FileStatus[] = pdfs.map(f => ({
      file: f,
      status: "pending"
    }));
    setFileStatuses(statuses);
    setIsProcessing(true);

    // Sequential upload — one by one
    for (let i = 0; i < pdfs.length; i++) {
      updateStatus(i, { status: "uploading" });
      try {
        const paper = await uploadPaper(pdfs[i]);
        updateStatus(i, { status: "done", result: paper });
        onUploaded(paper);
      } catch (err: any) {
        updateStatus(i, { status: "error", error: err.message });
      }
      // Small delay to avoid Gemini rate limit
      if (i < pdfs.length - 1) await new Promise(r => setTimeout(r, 2000));
    }

    setIsProcessing(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const statusIcon = (s: FileStatus) => {
    if (s.status === "pending") return "⏳";
    if (s.status === "uploading") return "🔄";
    if (s.status === "done") return "✅";
    return "❌";
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <label className="block cursor-pointer">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple              
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            handleFiles(files);
          }}
        />
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors
            ${dragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
              : "border-gray-300 dark:border-gray-600 hover:border-indigo-400"}
            ${isProcessing ? "opacity-60 pointer-events-none" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="text-4xl mb-3">📄</div>
          {isProcessing ? (
            <p className="text-indigo-600 dark:text-indigo-400 font-medium">
              Processing PDFs...
            </p>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                Drop PDFs here, or click to browse
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Multiple PDFs supported · Max 20 MB each · PDF only
              </p>
            </>
          )}
        </div>
      </label>

      {/* Progress list */}
      {fileStatuses.length > 0 && (
        <div className="mt-4 space-y-2">
          {fileStatuses.map((fs, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg text-sm
              ${fs.status === "done" ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                : fs.status === "error" ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400"
                : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>
              <span className={fs.status === "uploading" ? "animate-spin" : ""}>
                {statusIcon(fs)}
              </span>
              <span className="flex-1 truncate">{fs.file.name}</span>
              {fs.status === "error" && (
                <span className="text-xs text-red-500">{fs.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}