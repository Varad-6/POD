import pandas as pd
import json

file_path = r"C:\Users\ali\Downloads\Contract Data.xlsx"
excel = pd.ExcelFile(file_path)

print("Sheet names:", excel.sheet_names)

for sheet in excel.sheet_names:
    df = pd.read_excel(file_path, sheet_name=sheet)
    print(f"\n--- SHEET: {sheet} ---")
    print("Columns:", df.columns.tolist())
    print(df.to_string())
