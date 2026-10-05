#!/usr/bin/env python3
"""
Lightweight visual document renderer for OpenAI Vision
Converts PDF pages into base64 PNG images and extracts raw text
"""
import sys
import os
import json
import base64

def convert(pdf_path):
    if not os.path.exists(pdf_path):
        return {"error": "File not found", "images": [], "text": ""}
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        images = []
        text_parts = []
        for i, page in enumerate(doc):
            if i >= 3:  # Process up to 3 pages
                break
            pix = page.get_pixmap(dpi=150)
            png_bytes = pix.tobytes("png")
            images.append(base64.b64encode(png_bytes).decode("utf-8"))
            text_parts.append(page.get_text())
        return {"images": images, "text": "\n".join(text_parts).strip()}
    except Exception as e:
        return {"error": str(e), "images": [], "text": ""}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file argument provided", "images": [], "text": ""}))
        sys.exit(1)
    res = convert(sys.argv[1])
    print(json.dumps(res))
