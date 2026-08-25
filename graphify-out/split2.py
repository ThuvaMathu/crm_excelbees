import json
from pathlib import Path

uncached_text = Path("graphify-out/.graphify_uncached.txt").read_text(encoding="utf-8").strip()
uncached = [l for l in uncached_text.splitlines() if l.strip()]

# Skip blog images - static assets with no architectural value
skip_exts = {".png",".jpg",".jpeg",".gif",".webp",".svg",".ico"}
files = [f for f in uncached if Path(f).suffix.lower() not in skip_exts]

print(f"Files for semantic extraction: {len(files)}")

chunk_size = 25
chunks = [files[i:i+chunk_size] for i in range(0, len(files), chunk_size)]
print(f"Chunks: {len(chunks)}")
for i, chunk in enumerate(chunks):
    Path(f"graphify-out/chunk_list_{i:02d}.txt").write_text("\n".join(chunk), encoding="utf-8")
    print(f"  Chunk {i:02d}: {len(chunk)} files")
