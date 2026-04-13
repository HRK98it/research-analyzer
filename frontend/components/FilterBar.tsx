"use client";
import { FilterParams } from "@/lib/api";

interface Props {
  filters: FilterParams;
  years: string[];
  models: string[];
  datasets: string[];
  onChange: (filters: FilterParams) => void;
  onClear: () => void;
}

export default function FilterBar({ filters, years, models, datasets, onChange, onClear }: Props) {
  const hasFilters = filters.year || filters.model_used || filters.dataset;

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Year</label>
        <select
          value={filters.year || ""}
          onChange={(e) => onChange({ ...filters, year: e.target.value || undefined })}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 min-w-[100px]"
        >
          <option value="">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Model</label>
        <select
          value={filters.model_used || ""}
          onChange={(e) => onChange({ ...filters, model_used: e.target.value || undefined })}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 min-w-[140px]"
        >
          <option value="">All models</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Dataset</label>
        <select
          value={filters.dataset || ""}
          onChange={(e) => onChange({ ...filters, dataset: e.target.value || undefined })}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 min-w-[140px]"
        >
          <option value="">All datasets</option>
          {datasets.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}