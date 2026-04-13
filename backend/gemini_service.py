import os
import json
import re
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

MODEL_NAME = "gemini-3-flash-preview"


def analyze_paper(text: str) -> dict:
    """Send extracted text to Gemini and return structured fields."""

    model = genai.GenerativeModel(MODEL_NAME)

    prompt = f"""
You are a research paper metadata extractor. Be aggressive and precise.

Extract these fields:

- title: The full title of the paper
- publication: Identify source like IEEE, Springer, arXiv, ACM, Elsevier, MDPI (NOT just hosting like ResearchGate unless no other found)
- authors: Comma-separated list of author names  
- year: Publication year (4-digit number)
- model_used: Extract ONLY the primary or best-performing model
- accuracy: Extract the performance metric specifically for that model (accuracy, F1, precision, recall, AUC)
- dataset: Dataset name used

Rules:
- Search entire text (abstract, methodology, results, conclusion)
- Prefer official publishers over hosting sites
- If not found return null
- Return ONLY valid JSON

Paper text:
{text}

Return JSON:
"""

    max_retries = 3

    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            raw = response.text.strip()

            # Remove markdown formatting
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)

            result = json.loads(raw)

            # 🔥 MODEL CLEANUP (take first if multiple)
            model_used = result.get("model_used")
            if model_used:
                model_used = model_used.split(",")[0].strip()

            # 🔥 PUBLICATION FALLBACK (if Gemini fails)
            publication = result.get("publication")
            if not publication:
                text_lower = text.lower()
                if "ieee" in text_lower:
                    publication = "IEEE"
                elif "springer" in text_lower:
                    publication = "Springer"
                elif "arxiv" in text_lower:
                    publication = "arXiv"
                elif "elsevier" in text_lower:
                    publication = "Elsevier"
                elif "acm" in text_lower:
                    publication = "ACM"
                elif "mdpi" in text_lower:
                    publication = "MDPI"
                elif "researchgate" in text_lower:
                    publication = "ResearchGate"

            return {
                "title": result.get("title"),
                "publication": publication,
                "authors": result.get("authors"),
                "year": str(result.get("year")) if result.get("year") else None,
                "model_used": model_used,
                "accuracy": result.get("accuracy"),
                "dataset": result.get("dataset"),
            }

        except Exception as e:
            error_str = str(e)

            # Retry on rate limit
            if "429" in error_str and attempt < max_retries - 1:
                wait_time = 60 * (attempt + 1)
                print(f"Rate limited. Waiting {wait_time}s...")
                time.sleep(wait_time)
                continue

            # Handle bad JSON safely
            if isinstance(e, json.JSONDecodeError):
                return {
                    "title": None,
                    "publication": None,
                    "authors": None,
                    "year": None,
                    "model_used": None,
                    "accuracy": None,
                    "dataset": None,
                }

            raise RuntimeError(f"Gemini API error: {error_str}")

    raise RuntimeError("Gemini API rate limit exceeded after retries.")