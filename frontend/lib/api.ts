import axios from "axios";

const BACKEND_URL = "https://research-analyzer.onrender.com";

const API = axios.create({
  baseURL: BACKEND_URL,
  timeout: 120000,
});

export interface Paper {
  id: number;
  title: string | null;
  publication: string | null;
  authors: string | null;
  year: string | null;
  model_used: string | null;
  accuracy: string | null;
  dataset: string | null;
  filename: string;
  uploaded_at: string;
}

export interface FilterParams {
  year?: string;
  model_used?: string;
  dataset?: string;
}

export async function uploadPaper(file: File): Promise<Paper> {
  const form = new FormData();
  form.append("file", file);
  const res = await API.post<Paper>("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getPapers(filters: FilterParams = {}): Promise<Paper[]> {
  const params: Record<string, string> = {};
  if (filters.year) params.year = filters.year;
  if (filters.model_used) params.model_used = filters.model_used;
  if (filters.dataset) params.dataset = filters.dataset;
  const res = await API.get<Paper[]>("/papers", { params });
  return res.data;
}

export async function deletePaper(id: number): Promise<void> {
  await API.delete(`/papers/${id}`);
}

export function getDownloadUrl(filters: FilterParams = {}): string {
  const params = new URLSearchParams();
  if (filters.year) params.set("year", filters.year);
  if (filters.model_used) params.set("model_used", filters.model_used);
  if (filters.dataset) params.set("dataset", filters.dataset);
  const query = params.toString();
  return `${BACKEND_URL}/papers/download/pdf${query ? "?" + query : ""}`;
}