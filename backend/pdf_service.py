import pdfplumber
import io


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber."""
    try:
        text_parts = []

        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            # Read up to 20 pages
            for page in pdf.pages[:20]:
                text = page.extract_text()
                if text:
                    text_parts.append(text)

        full_text = "\n".join(text_parts)

        return full_text[:20000]

    except Exception as e:
        raise ValueError(f"Failed to extract PDF text: {str(e)}")