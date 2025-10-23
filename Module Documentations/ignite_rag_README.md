# Ignite + RAG-Anything (vector DB + Graph)

This module lets us run a coder LLM (IBM Ignite or any HF/OpenAI-compatible model) with
RAG over the vector database we built earlier, and optionally extend with a Graph DB.

## Layout

```
src/ignite_rag/
  config.py           # env-driven settings
  model.py            # HF or OpenAI-compatible model runtime
  faiss_retriever.py  # loads the FAISS index built earlier
  prompt.py           # system instruction + formatting
  pipeline.py         # end-to-end RAG (plain)
  rag_anything_adapter.py  # optional use of rag-anything if installed
  graph_provider.py   # stub to enrich with Graph DB (Graphiti-ready hook)
server.py             # FastAPI service
cli.py                # CLI to query
requirements.txt
```

## Quickstart

> Make sure we have your **existing FAISS index** and **meta.jsonl** (from the previous step).

```bash
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Point to your index
export INDEX_DIR=../data/faiss_index
export META_PATH=../data/meta.jsonl

# Choose a model runtime (one of these):
# A) HuggingFace (local GPU/CPU) - set a valid HF model id
export MODEL_BACKEND=huggingface
export HF_MODEL_ID=codellama/CodeLlama-7b-Instruct-hf   # We will change it with IBM Ignite coder model id
# Optional: HF_TOKEN if model is gated

# B) OpenAI-compatible endpoint (OpenRouter, vLLM server, etc.)
# export MODEL_BACKEND=openai_compatible
# export OPENAI_API_BASE=https://openrouter.ai/api/v1
# export OPENAI_API_KEY=sk-...
# export OPENAI_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct

# Run CLI
python cli.py "How do I read a CSV in pandas?"

# Or start an API server
uvicorn server:app --host 0.0.0.0 --port 8000
# POST http://localhost:8000/ask  {"query":"How to parse query params in FastAPI?"}
```

### Optional: rag-anything

If we prefer to orchestrate via **rag-anything**, we can install it and set `USE_RAG_ANYTHING=true`:

```bash
pip install rag-anything  # if available
export USE_RAG_ANYTHING=true
python cli.py "build a dataframe from nested dicts"
```

### Optional: Graph DB (Graphiti)

Fill in `graph_provider.py` to fetch neighbor docs / API symbol sheets and the pipeline will
merge them into context. Set:

```bash
export GRAPH_ENABLE=true
export GRAPH_ENDPOINT=http://localhost:9999
```

---

## Notes

- This module avoids hard-coding a specific “Ignite” identifier. We need to Set `HF_MODEL_ID` or use an OpenAI-compatible or Ollama gateway that serves our Ignite weights.
- Retrieval uses cosine similarity on normalized embeddings (the same BGE we used to build the FAISS index).
