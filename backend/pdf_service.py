import fitz  # PyMuPDF


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts = []
        # Read up to 20 pages to capture results/appendix sections
        for page_num in range(min(20, len(doc))):
            page = doc[page_num]
            text_parts.append(page.get_text())
        doc.close()
        full_text = "\n".join(text_parts)
        # Increased limit to capture more content for better extraction
        return full_text[:20000]
    except Exception as e:
        raise ValueError(f"Failed to extract PDF text: {str(e)}")