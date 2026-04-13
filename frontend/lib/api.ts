import axios from "axios";

const API_BASE = "http://127.0.0.1:8000"; // 🔥 FIXED

const API = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

export interface Paper {
  id: number;
  title: string | null;
  publication: string | null; // 🔥 ADD (important)
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

export async function uploadPaper(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  console.log("📡 CALLING API...");

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  console.log("📡 STATUS:", res.status);

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ ERROR:", text);
    throw new Error(text || "Upload failed");
  }

  const data = await res.json();
  console.log("✅ DATA:", data);

  return data;
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
  return `${API_BASE}/papers/download/pdf${query ? "?" + query : ""}`;
}