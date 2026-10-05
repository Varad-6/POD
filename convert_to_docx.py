"""
convert_to_docx.py
Converts PODZO_MASTER_BUILD_PROMPT.md -> PODZO_MASTER_BUILD_PROMPT.docx
Uses python-docx. Handles: headings (# ## ###), code blocks (```), tables (|),
bullet lists (- / *), bold (**text**), horizontal rules (---).
"""

import re
import sys
from pathlib import Path
from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

MD_FILE  = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / "PODZO_MASTER_BUILD_PROMPT.md"
OUT_FILE = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).parent / "PODZO_MASTER_BUILD_PROMPT.docx"


# ─── helpers ────────────────────────────────────────────────────────────────

def set_cell_bg(cell, hex_color: str):
    """Set a table cell background colour."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  hex_color)
    tcPr.append(shd)


def add_run_with_bold(para, text: str):
    """Parse **bold** segments and add runs accordingly."""
    parts = re.split(r'\*\*(.+?)\*\*', text)
    for i, part in enumerate(parts):
        run = para.add_run(part)
        if i % 2 == 1:          # odd indexes are inside **...**
            run.bold = True
    return para


def style_code_para(para, doc):
    """Apply monospace / shaded style to a code paragraph."""
    para.style = doc.styles['Normal']
    for run in para.runs:
        run.font.name = 'Courier New'
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    # indent
    para.paragraph_format.left_indent = Inches(0.3)


# ─── main converter ─────────────────────────────────────────────────────────

def convert(md_path: Path, out_path: Path):
    doc = Document()

    # ── page margins ──
    for section in doc.sections:
        section.top_margin    = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin   = Cm(2.5)
        section.right_margin  = Cm(2.5)

    # ── default body font ──
    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(10)

    lines = md_path.read_text(encoding='utf-8').splitlines()

    i = 0
    while i < len(lines):
        line = lines[i]

        # ── Heading 1  (#) ──────────────────────────────────────────────────
        if line.startswith('# ') and not line.startswith('## '):
            text = line[2:].strip()
            h = doc.add_heading(text, level=1)
            h.runs[0].font.color.rgb = RGBColor(0xFF, 0x5B, 0x00)  # PODZO orange
            i += 1; continue

        # ── Heading 2  (##) ─────────────────────────────────────────────────
        if line.startswith('## ') and not line.startswith('### '):
            text = line[3:].strip()
            h = doc.add_heading(text, level=2)
            h.runs[0].font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
            i += 1; continue

        # ── Heading 3  (###) ────────────────────────────────────────────────
        if line.startswith('### '):
            text = line[4:].strip()
            h = doc.add_heading(text, level=3)
            i += 1; continue

        # ── Heading 4  (####) ───────────────────────────────────────────────
        if line.startswith('#### '):
            text = line[5:].strip()
            h = doc.add_heading(text, level=4)
            i += 1; continue

        # ── Horizontal rule (--- or ===) ─────────────────────────────────────
        if re.match(r'^[-=]{3,}\s*$', line):
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(4)
            i += 1; continue

        # ── Code block  (``` ... ```) ────────────────────────────────────────
        if line.startswith('```'):
            i += 1
            code_lines = []
            while i < len(lines) and not lines[i].startswith('```'):
                code_lines.append(lines[i])
                i += 1
            i += 1  # skip closing ```

            # Add a shaded paragraph for each line
            for cl in code_lines:
                p = doc.add_paragraph()
                p.paragraph_format.left_indent  = Inches(0.3)
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after  = Pt(0)
                run = p.add_run(cl if cl else ' ')
                run.font.name = 'Courier New'
                run.font.size = Pt(8)
                run.font.color.rgb = RGBColor(0xD1, 0xD5, 0xDB)
                # light grey shade on paragraph
                pPr  = p._p.get_or_add_pPr()
                shd  = OxmlElement('w:shd')
                shd.set(qn('w:val'),   'clear')
                shd.set(qn('w:color'), 'auto')
                shd.set(qn('w:fill'),  '1E293B')
                pPr.append(shd)

            # spacer after code block
            doc.add_paragraph().paragraph_format.space_after = Pt(4)
            continue

        # ── Markdown table  (| col | col |) ─────────────────────────────────
        if line.startswith('|'):
            table_lines = []
            while i < len(lines) and lines[i].startswith('|'):
                table_lines.append(lines[i])
                i += 1

            # parse header + separator + data rows
            rows_raw = [
                [cell.strip() for cell in ln.strip('|').split('|')]
                for ln in table_lines
                if not re.match(r'^\|[\s\-|:]+\|$', ln)
            ]
            if not rows_raw:
                continue

            col_count = max(len(r) for r in rows_raw)
            tbl = doc.add_table(rows=len(rows_raw), cols=col_count)
            tbl.style = 'Table Grid'

            for ri, row in enumerate(rows_raw):
                for ci, cell_text in enumerate(row):
                    if ci >= col_count:
                        break
                    cell = tbl.cell(ri, ci)
                    cell.text = ''
                    p = cell.paragraphs[0]
                    add_run_with_bold(p, cell_text)
                    p.paragraph_format.space_before = Pt(1)
                    p.paragraph_format.space_after  = Pt(1)
                    for run in p.runs:
                        run.font.size = Pt(9)
                    if ri == 0:
                        for run in p.runs:
                            run.bold = True
                        set_cell_bg(cell, '243447')
                        for run in p.runs:
                            run.font.color.rgb = RGBColor(0xF1, 0xF5, 0xF9)
                    elif ri % 2 == 0:
                        set_cell_bg(cell, 'F8FAFC')

            doc.add_paragraph().paragraph_format.space_after = Pt(6)
            continue

        # ── Bullet list  (- text or * text) ─────────────────────────────────
        bullet_match = re.match(r'^(\s*)([-*]|\d+\.)\s+(.*)', line)
        if bullet_match:
            indent_spaces = len(bullet_match.group(1))
            level = min(indent_spaces // 2, 3)
            text  = bullet_match.group(3).strip()
            style_name = 'List Bullet' if level == 0 else f'List Bullet {level + 1}'
            try:
                p = doc.add_paragraph(style=style_name)
            except KeyError:
                p = doc.add_paragraph(style='List Bullet')
            add_run_with_bold(p, text)
            for run in p.runs:
                run.font.size = Pt(10)
            i += 1; continue

        # ── Blank line ────────────────────────────────────────────────────────
        if line.strip() == '':
            doc.add_paragraph().paragraph_format.space_after = Pt(2)
            i += 1; continue

        # ── Regular paragraph ─────────────────────────────────────────────────
        p = doc.add_paragraph()
        add_run_with_bold(p, line)
        for run in p.runs:
            run.font.size = Pt(10)
        i += 1

    # ── Save ──────────────────────────────────────────────────────────────────
    doc.save(out_path)
    print(f"[OK] Saved: {out_path}")
    print(f"     Size : {out_path.stat().st_size / 1024:.1f} KB")


if __name__ == '__main__':
    if not MD_FILE.exists():
        print(f"❌ Not found: {MD_FILE}", file=sys.stderr)
        sys.exit(1)
    convert(MD_FILE, OUT_FILE)
