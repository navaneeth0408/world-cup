import pandas as pd
import json

file_path = "c:\\Users\\DELL\\OneDrive\\Desktop\\worldcup-2026\\src\\data\\round_of_32_wikipedia_format.xlsx"
out_path = "c:\\Users\\DELL\\OneDrive\\Desktop\\worldcup-2026\\src\\data\\round_of_32_seeding.json"

df = pd.read_excel(file_path)

# Let's see the columns and the first few rows
print(df.columns.tolist())
print(df.head())

# Save basic structure to json to see what it looks like
df.to_json(out_path, orient="records")
print(f"Saved to {out_path}")
