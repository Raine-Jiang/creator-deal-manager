<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Creator Deal Manager Agent Context

Before working on this project, read `docs/PROJECT_CONTEXT.md` first and treat it as the canonical compact context.

Minimize token usage:

- Do not mine previous chat history unless the current request cannot be answered from project files.
- For small fixes, read only `docs/PROJECT_CONTEXT.md` and the directly affected files.
- Keep edits scoped, run relevant checks, and update `docs/PROJECT_CONTEXT.md` when product logic or schema changes.
