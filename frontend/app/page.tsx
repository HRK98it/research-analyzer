"use client";
import { useEffect, useState, useCallback } from "react";
import UploadForm from "@/components/UploadForm";
import PapersTable from "@/components/PapersTable";
import FilterBar from "@/components/FilterBar";
import { Paper, FilterParams, getPapers, getDownloadUrl } from "@/lib/api";

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filters, setFilters] = useState<FilterParams>({});
  const [loading, setLoading] = useState(true);
  const [allPapers, setAllPapers] = useState<Paper[]>([]);

  const fetchPapers = useCallback(async (f: FilterParams) => {
    setLoading(true);
    try {
      const data = await getPapers(f);
      setPapers(data);
    } catch {
      console.error("Failed to fetch papers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPapers(filters);
  }, [filters, fetchPapers]);

  useEffect(() => {
    getPapers({}).then(setAllPapers).catch(() => {});
  }, [papers]);

  const years = [...new Set(allPapers.map((p) => p.year).filter(Boolean))].sort().reverse() as string[];
  const models = [...new Set(allPapers.map((p) => p.model_used).filter(Boolean))].sort() as string[];
  const datasets = [...new Set(allPapers.map((p) => p.dataset).filter(Boolean))].sort() as string[];

  const handleUploaded = (paper: Paper) => {
    setPapers((prev) => [paper, ...prev]);
  };

  const handleDeleted = (id: number) => {
    setPapers((prev) => prev.filter((p) => p.id !== id));
  };

  const downloadUrl = getDownloadUrl(filters);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Research Paper Analyzer
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Upload a PDF and let Gemini AI extract structured metadata automatically.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5">
            Upload Paper
          </h2>
          <UploadForm onUploaded={handleUploaded} />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Papers
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({papers.length})
              </span>
            </h2>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
  Download PDF Report
</a>
          </div>

          <div className="mb-5">
            <FilterBar
              filters={filters}
              years={years}
              models={models}
              datasets={datasets}
              onChange={setFilters}
              onClear={() => setFilters({})}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              Loading papers...
            </div>
          ) : (
            <PapersTable papers={papers} onDeleted={handleDeleted} />
          )}
        </div>

      </div>
    </main>
  );
}