import json

try:
    with open('package.json', 'r', encoding='utf-8') as f:
        json.load(f)
    print("Valid JSON")
except json.JSONDecodeError as e:
    print(f"Invalid JSON at line {e.lineno}, column {e.colno}: {e.msg}")
    with open('package.json', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        print(f"Line {e.lineno}: {lines[e.lineno-1].strip()}")
except Exception as e:
    print(f"Error: {e}")
