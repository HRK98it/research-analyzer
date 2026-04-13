from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import io

from database import get_db, create_tables, Paper
from models import PaperResponse
from pdf_service import extract_text_from_pdf
from gemini_service import analyze_paper

# ReportLab for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch

app = FastAPI(title="Research Paper Analyzer API", version="1.0.0")

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://research-analyzer-one.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    create_tables()


@app.get("/")
def root():
    return {"status": "ok", "message": "Research Paper Analyzer API"}


@app.post("/upload", response_model=PaperResponse)
async def upload_paper(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:  # 20 MB limit
        raise HTTPException(status_code=400, detail="File too large. Max 20 MB.")

    # Step 1: Extract text
    try:
        text = extract_text_from_pdf(contents)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from PDF. It may be scanned/image-only.")

    # Step 2: Analyze with Gemini
    try:
        extracted = analyze_paper(text)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Step 3: Save to DB
    paper = Paper(
        title=extracted["title"],
        publication=extracted.get("publication"),
        authors=extracted["authors"],
        year=extracted["year"],
        model_used=extracted["model_used"],
        accuracy=extracted["accuracy"],
        dataset=extracted["dataset"],
        filename=file.filename,
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper


@app.get("/papers", response_model=List[PaperResponse])
def list_papers(
    year: Optional[str] = Query(None),
    model_used: Optional[str] = Query(None),
    dataset: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Paper)
    if year:
        query = query.filter(Paper.year == year)
    if model_used:
        query = query.filter(Paper.model_used.ilike(f"%{model_used}%"))
    if dataset:
        query = query.filter(Paper.dataset.ilike(f"%{dataset}%"))
    return query.order_by(Paper.uploaded_at.desc()).all()


@app.get("/papers/{paper_id}", response_model=PaperResponse)
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")
    return paper


@app.delete("/papers/{paper_id}")
def delete_paper(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")
    db.delete(paper)
    db.commit()
    return {"message": "Deleted successfully."}


@app.get("/papers/download/pdf")
def download_papers_pdf(
    year: Optional[str] = Query(None),
    model_used: Optional[str] = Query(None),
    dataset: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Paper)
    if year:
        query = query.filter(Paper.year == year)
    if model_used:
        query = query.filter(Paper.model_used.ilike(f"%{model_used}%"))
    if dataset:
        query = query.filter(Paper.dataset.ilike(f"%{dataset}%"))

    papers = query.order_by(Paper.uploaded_at.desc()).all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph("Research Papers Report", styles["Heading1"]))
    elements.append(Spacer(1, 10))

    # 🔥 Word wrap style
    styleN = styles["Normal"]
    styleN.wordWrap = 'CJK'

    # 🔥 HEADERS (with Publication)
    col_headers = ["#", "Title", "Authors", "Year", "Publication", "Model", "Accuracy", "Dataset"]
    data = [col_headers]

    for i, p in enumerate(papers, 1):

        def truncate(s, n=30):
            if s and len(s) > n:
                return s[:n] + "..."
            return s or "—"

        data.append([
            str(i),
            Paragraph(truncate(p.title, 35), styleN),
            Paragraph(truncate(p.authors, 25), styleN),
            p.year or "—",
            Paragraph(truncate(p.publication, 20), styleN),  # 🔥 NEW
            Paragraph(truncate(p.model_used, 20), styleN),
            Paragraph(truncate(p.accuracy, 15), styleN),
            Paragraph(truncate(p.dataset, 20), styleN),
        ])

    # 🔥 FIXED WIDTHS (balanced)
    col_widths = [
        0.3*inch,
        1.8*inch,
        1.3*inch,
        0.6*inch,
        1.2*inch,
        1.2*inch,
        1.0*inch,
        1.2*inch
    ]

    table = Table(data, colWidths=col_widths, repeatRows=1)

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F5")]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#DDDDDD")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))

    elements.append(table)
    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=papers_report.pdf"}
    )