"use client";
import { Paper, deletePaper } from "@/lib/api";
import { useState } from "react";

interface Props {
  papers: Paper[];
  onDeleted: (id: number) => void;
}

const nullText = (s: string | null) =>
  s ? s : <span className="text-gray-400 italic text-xs">—</span>;

export default function PapersTable({ papers, onDeleted }: Props) {
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this paper from the database?")) return;
    setDeleting(id);
    try {
      await deletePaper(id);
      onDeleted(id);
    } catch {
      alert("Failed to delete. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (papers.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-lg font-medium">No papers yet</p>
        <p className="text-sm mt-1">Upload a PDF above to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-indigo-600 text-white">
            {["Title", "Authors", "Year", "Publication", "Model Used", "Accuracy", "Dataset", ""].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {papers.map((paper, i) => (
            <tr
              key={paper.id}
              className={`border-t border-gray-100 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors
                ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}`}
            >
              {/* Title */}
              <td className="px-4 py-3 max-w-[200px]">
                <div className="font-medium text-gray-900 dark:text-gray-100 truncate" title={paper.title || ""}>
                  {nullText(paper.title)}
                </div>
                <div className="text-xs text-gray-400 truncate">{paper.filename}</div>
              </td>

              {/* Authors */}
              <td className="px-4 py-3 max-w-[160px]">
                <div className="truncate text-gray-700 dark:text-gray-300" title={paper.authors || ""}>
                  {nullText(paper.authors)}
                </div>
              </td>

              {/* Year */}
              <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                {nullText(paper.year)}
              </td>

              {/* 🔥 NEW: Publication */}
              <td className="px-4 py-3 whitespace-nowrap">
                {paper.publication ? (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium">
                    {paper.publication}
                  </span>
                ) : (
                  nullText(null)
                )}
              </td>

              {/* Model */}
              <td className="px-4 py-3 max-w-[120px]">
                {paper.model_used ? (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-medium truncate max-w-full">
                    {paper.model_used}
                  </span>
                ) : nullText(null)}
              </td>

              {/* Accuracy */}
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {nullText(paper.accuracy)}
              </td>

              {/* Dataset */}
              <td className="px-4 py-3 max-w-[130px]">
                <div className="truncate text-gray-700 dark:text-gray-300" title={paper.dataset || ""}>
                  {nullText(paper.dataset)}
                </div>
              </td>

              {/* Delete */}
              <td className="px-4 py-3">
                <button
                  onClick={() => handleDelete(paper.id)}
                  disabled={deleting === paper.id}
                  className="text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-40"
                  title="Delete"
                >
                  {deleting === paper.id ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}