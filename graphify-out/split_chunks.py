import json
from pathlib import Path

detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding="utf-8-sig"))
uncached = Path('graphify-out/.graphify_uncached.txt').read_text(encoding="utf-8").strip().split('\n')

# Separate images from other files
images = [f for f in uncached if Path(f).suffix.lower() in {'.png','.jpg','.jpeg','.gif','.webp','.svg','.ico'}]
others = [f for f in uncached if f not in images]

print(f"Images: {len(images)}, Other files: {len(others)}")

# Chunk non-image files into groups of 22
chunks = []
chunk_size = 22
for i in range(0, len(others), chunk_size):
    chunks.append(others[i:i+chunk_size])

# Each image gets its own chunk
for img in images:
    chunks.append([img])

print(f"Total chunks: {len(chunks)}")
for i, chunk in enumerate(chunks):
    Path(f'graphify-out/.graphify_chunk_list_{i:02d}.txt').write_text('\n'.join(chunk), encoding="utf-8")

print("Chunk lists written")
