# Paykar code graph

This folder contains a Graphify code-structure graph for the Paykar repository. It indexes source code only; archived design documents and image assets were intentionally excluded from this architecture graph.

## Outputs

- `graphify-out/graph.html` — interactive graph visualization
- `graphify-out/graph.json` — machine-readable nodes, relationships, and curated community names
- `graphify-out/GRAPH_REPORT.md` — graph summary, hubs, and cross-community connections
- `graphify-out/.graphify_analysis.json` — community membership and analysis data

## Query the graph

Run these from the repository root:

```powershell
graphify god-nodes --top 10 --graph grafify/graphify-out/graph.json
graphify query "How does the catalog connect to cart and checkout?" --graph grafify/graphify-out/graph.json
```

Rebuild the code-only graph after source changes:

```powershell
graphify extract . --code-only --out grafify
```

Graphify flagged `apps/web/src/styles/tokens.css` as potentially sensitive and skipped it. `pyproject.toml` produced no graph nodes. The scan also skipped non-code configuration formats and the 114 documentation/image files by design.
