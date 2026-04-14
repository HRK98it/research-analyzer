import os
import json
import re
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


MODEL_NAME = "gemini-2.0-flash"


def analyze_paper(text: str) -> dict:
    """Send extracted text to Gemini and return structured fields."""

    model = genai.GenerativeModel(MODEL_NAME)

    prompt = f"""
You are an expert research paper metadata extractor. Your job is to find information even when it's not explicitly stated.

Extract these fields from the research paper text:

1. title: Full paper title. Look at the very beginning of the text.

2. publication: Journal/conference name. Look for:
   - IEEE, Springer, Elsevier, ACM, MDPI, arXiv, Nature, Wiley
   - Conference names like CVPR, NeurIPS, ICML, AAAI, ICCV
   - Journal names in header/footer
   - DOI prefix can hint at publisher

3. authors: All author names comma separated. Usually right after title.

4. year: 4-digit publication year. Look in:
   - Copyright notice like "© 2023"
   - "Received", "Accepted", "Published" dates
   - Conference year in title or header
   - DOI or URL containing year

5. model_used: Primary ML/AI model or algorithm. Look for:
   - Deep learning: CNN, RNN, LSTM, GRU, Transformer, BERT, GPT, ResNet, VGG, YOLO
   - Classical ML: SVM, Random Forest, Naive Bayes, KNN, Decision Tree, XGBoost, Logistic Regression
   - Custom model names the authors propose
   - Look in: abstract, methodology, proposed system, experiments sections
   - If multiple models compared, pick the one with BEST performance

6. accuracy: Best performance metric. Look for:
   - Accuracy %, F1-score, Precision, Recall, AUC-ROC, BLEU, mAP
   - Look in: results, evaluation, experiments, conclusion sections
   - Tables with numbers (extract the best/highest value)
   - Phrases like "achieved", "obtained", "proposed method", "our model"
   - Format example: "98.2% accuracy" or "F1: 0.94"

7. dataset: Dataset name used. Look for:
   - Known datasets: MNIST, CIFAR, ImageNet, COCO, SQuAD, GLUE, IMDb
   - Fake news: LIAR, FakeNewsNet, BuzzFeed, ISOT, FA-KES
   - Custom datasets: "we collected", "we created", "our dataset"
   - Look in: dataset section, experiments, methodology

IMPORTANT RULES:
- Search the ENTIRE text very carefully
- For accuracy: even if you see "93%" anywhere near results, extract it
- For model: even if only mentioned once in methodology, extract it
- For year: if you see any date, extract the year from it
- For dataset: if you see any data source mentioned, extract it
- Only return null if the information is truly completely absent
- Return ONLY valid JSON, no markdown, no explanation

Paper text:
{text}

Return this exact JSON format:
{{
  "title": "...",
  "publication": "...",
  "authors": "...",
  "year": "...",
  "model_used": "...",
  "accuracy": "...",
  "dataset": "..."
}}
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

            # MODEL CLEANUP (take first if multiple)
            model_used = result.get("model_used")
            if model_used:
                model_used = model_used.split(",")[0].strip()

            # PUBLICATION FALLBACK (if Gemini fails)
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
                elif "wiley" in text_lower:
                    publication = "Wiley"
                elif "nature" in text_lower:
                    publication = "Nature"
                elif "neurips" in text_lower or "nips" in text_lower:
                    publication = "NeurIPS"
                elif "cvpr" in text_lower:
                    publication = "CVPR"
                elif "iccv" in text_lower:
                    publication = "ICCV"
                elif "icml" in text_lower:
                    publication = "ICML"
                elif "aaai" in text_lower:
                    publication = "AAAI"

            
            year = str(result.get("year")) if result.get("year") else None
            if not year:
                # Check copyright notice
                year_match = re.search(r"©\s*(20\d{2}|19\d{2})", text)
                if not year_match:
                    # Check author citation pattern like "Author (2019)"
                    year_match = re.search(r"\(\s*(20\d{2}|19\d{2})\s*\)", text)
                if not year_match:
                    # Any 4 digit year
                    year_match = re.search(r"\b(20\d{2}|19\d{2})\b", text)
                if year_match:
                    year = year_match.group(1)

            return {
                "title": result.get("title"),
                "publication": publication,
                "authors": result.get("authors"),
                "year": year,
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
