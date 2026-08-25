import json
from pathlib import Path

detect = json.loads(Path("graphify-out/.graphify_detect.json").read_text(encoding="utf-8-sig"))
images = detect["files"].get("image", [])
for f in images[:20]:
    print(f)
