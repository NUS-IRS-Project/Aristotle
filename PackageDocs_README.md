# PackageDocs

End-to-end pipeline to **discover → fetch → normalize → chunk → embed → index** documentation for Python libraries,
for the GraphRAG-enabled code-doc chatbot "Aristotle".

> ⚖️ **Respect licenses and robots.txt**. This project defaults to being polite: user-agent, rate limits, robots checks, and per-project license capture.

## Features

- Sources: PyPI metadata, GitHub (Markdown files in repo), Read the Docs (HTML → Markdown), any sitemap-aware docs site.
- Normalizes to Markdown with reproducible **front-matter** metadata (package, version, URL, license, commit).
- Chunking that preserves code fences and respects headings.
- Embeddings: configurable (**default**: `bge-small-en-v1.5`, SentenceTransformers).
- Vector stores: FAISS (default, local), Qdrant (optional).
- Graph hooks: emit light-weight nodes/edges JSON to stitch with your GraphRAG pipeline.

## Quickstart

```bash
# 0) Python 3.10+ recommended
python -m venv .venv && source .venv/bin/activate  # (Windows: .venv\Scripts\activate)

# 1) Install
pip install -r requirements.txt

# 2) (Optional) GitHub token for higher rate limits
export GITHUB_TOKEN=ghp_token

# 3) Run an example (numpy, pandas, requests)
python scripts/run_example.py --packages numpy pandas requests --max-pages 60 --out data

# 4) Build the FAISS index
python scripts/build_index.py --docs data/normalized --index data/faiss_index --meta data/meta.jsonl

# 5) Try a query (ad-hoc)
python -c "from packagedocs.store.faiss_store import load_index; idx,meta=load_index('data/faiss_index','data/meta.jsonl'); print(meta.search('read csv in pandas',k=3))"
```

## Structure

```
src/packagedocs/
  config.py
  discovery.py
  normalize.py
  chunk.py
  embed.py
  graph/build_graph.py
  fetchers/
    __init__.py
    github_md.py
    rtd_html.py
    utils.py
  store/
    faiss_store.py
    qdrant_store.py
scripts/
  run_example.py
  build_index.py
```

## Notes

- Many projects use **Sphinx**/**MkDocs** and host on **Read the Docs** or GitHub Pages. We fetch Markdown straight from repos when possible; otherwise we convert HTML to Markdown.
- Every saved Markdown has a YAML front-matter header with provenance fields:
  - `package`, `version`, `source_url`, `retrieved_at`, `license`, `repo`, `commit`, `path`.
- The **graph builder** emits nodes (`module`, `class`, `function`, `page`) and edges like `belongs_to`, `defines`, `mentions`, and `see_also`
