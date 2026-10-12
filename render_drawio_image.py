import os
import json
import html
from playwright.sync_api import sync_playwright

def render():
    drawio_path = r"C:\Users\Varad\Downloads\PODZO_End_to_End_Process_Flow.drawio"
    output_png = r"C:\Users\Varad\Downloads\PODZO_End_to_End_Process_Flow.png"
    
    with open(drawio_path, 'r', encoding='utf-8') as f:
        xml_content = f.read()

    config = {
        "highlight": "none",
        "nav": False,
        "resize": True,
        "toolbar": "",
        "edit": "",
        "xml": xml_content
    }
    json_attr = html.escape(json.dumps(config), quote=True)

    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PODZO Architecture Diagram</title>
    <style>
        body, html {{
            margin: 0;
            padding: 30px;
            background: #ffffff;
        }}
    </style>
</head>
<body>
    <div class="mxgraph" style="max-width:100%; border:none;" data-mxgraph="{json_attr}"></div>
    <script src="./viewer-static.min.js"></script>
</body>
</html>
"""

    temp_html = os.path.abspath("temp_render.html")
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    print("HTML created. Starting playwright...")
    with sync_playwright() as p:
        # Launch browser with high resolution
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1900, "height": 3400},
            device_scale_factor=2
        )
        page = context.new_page()
        
        file_url = "file:///" + temp_html.replace("\\", "/")
        print("Navigating to:", file_url)
        page.goto(file_url, wait_until="load")
        
        # Wait for SVG to render
        page.wait_for_selector(".mxgraph svg", timeout=15000)
        page.wait_for_timeout(3000)

        svg = page.query_selector(".mxgraph svg")
        if svg:
            print("Capturing SVG element to memory bytes...")
            img_bytes = svg.screenshot()
        else:
            print("Capturing full page...")
            img_bytes = page.screenshot(full_page=True)

        with open(output_png, "wb") as f:
            f.write(img_bytes)
        print(f"Successfully saved crisp image ({len(img_bytes)} bytes) to: {output_png}")

        browser.close()

    if os.path.exists(temp_html):
        os.remove(temp_html)

if __name__ == "__main__":
    render()
