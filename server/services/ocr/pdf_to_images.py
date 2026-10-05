#!/usr/bin/env python3
"""
Lightweight visual document renderer and text extractor for OpenAI Document Understanding.
Supports PyMuPDF (fitz), pypdf, and pypdf2.
"""
import sys
import os
import json
import base64

def convert(pdf_path):
    if not os.path.exists(pdf_path):
        return {"error": "File not found", "images": [], "text": ""}
    
    images = []
    text_parts = []

    # Strategy 1: PyMuPDF (fitz) - high quality page rendering & text
    try:
        import fitz
        doc = fitz.open(pdf_path)
        for i, page in enumerate(doc):
            if i >= 3:  # Process up to 3 pages
                break
            pix = page.get_pixmap(dpi=150)
            png_bytes = pix.tobytes("png")
            images.append(base64.b64encode(png_bytes).decode("utf-8"))
            text_parts.append(page.get_text())
        if images or text_parts:
            return {"images": images, "text": "\n".join(text_parts).strip()}
    except Exception:
        pass

    # Strategy 2: pypdf - pure python PDF parser
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            if i >= 3:
                break
            t = page.extract_text()
            if t:
                text_parts.append(t)
            # Extract any embedded images
            try:
                for img in page.images:
                    images.append(base64.b64encode(img.data).decode("utf-8"))
                    if len(images) >= 3:
                        break
            except Exception:
                pass
        if text_parts or images:
            return {"images": images, "text": "\n".join(text_parts).strip()}
    except Exception:
        pass

    # Strategy 3: PyPDF2 fallback
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            if i >= 3:
                break
            t = page.extract_text()
            if t:
                text_parts.append(t)
        if text_parts:
            return {"images": images, "text": "\n".join(text_parts).strip()}
    except Exception:
        pass

    return {"error": "No PDF extractor available", "images": images, "text": "\n".join(text_parts).strip()}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file argument provided", "images": [], "text": ""}))
        sys.exit(1)
    res = convert(sys.argv[1])
    print(json.dumps(res))
