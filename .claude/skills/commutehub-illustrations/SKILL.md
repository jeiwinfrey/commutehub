---
name: commutehub-illustrations
description: Generate or regenerate CommuteHub illustrations with one consistent flat style. Use for any new image asset in the app.
---

# CommuteHub illustrations

The single path for producing illustrations. Do not generate images any other way.

1. Read `prompt.md` at the repo root. Take the **Global style** block and the row for the requested asset (add a row first if it is new).
2. Call the Figma MCP `generate_image` tool with: Global style + a blank line + the asset prompt. Never alter the palette or the no-gradient/no-shadow/no-outline rules.
3. Save the result to `public/illustrations/<file>.png` (1:1, white background) using the `file` name from the table.
4. Reference it in the UI with `next/image` and a descriptive `alt`.
5. If the output has gradients, shadows or outlines, regenerate it; do not ship it.
