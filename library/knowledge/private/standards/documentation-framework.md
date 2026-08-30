# Documentation Framework

> Category: Standards | Version: 2.0 | Date: August 2026 | Status: Canonical

This repository uses library schema v2. `library/` is the source of truth for maintained documentation. Narrative docs use schema-v2 paths; `wiki-guardian` separately owns code-derived entities under `library/knowledge-base/wiki/`.

## Canonical structure

```text
library/
  README.md
  knowledge/
    public/
      overview/
      guides/
      faqs/
    private/
      architecture/
      standards/
      <domain>/
  knowledge-base/
    wiki/ # code-derived entities; Wiki Guardian only
  requirements/
    backlog/
    in-work/
    completed/
    reports/
  issues/
    backlog/
    in-work/
    completed/
  notes/
```

- `knowledge/public/` contains customer-facing overviews, guides, and FAQs.
- `knowledge/private/` contains internal engineering and business references. Architecture decisions use `knowledge/private/architecture/ADR-<n>-<slug>.md`.
- `knowledge-base/wiki/` contains code-derived entities maintained only by `wiki-guardian`.
- `requirements/` contains planned product work as PRDs.
- `issues/` contains reactive bug and incident work as IRDs.
- `notes/` is human-only. No agent may create, edit, rename, or delete anything beneath it.

The legacy paths `library/architecture/`, `library/requirements/features/`, `library/requirements/issues/`, and `library/qa/` are not valid destinations for new content. Under `library/knowledge-base/`, only the `wiki/` subtree is valid, and only for `wiki-guardian` output.

## PRDs and IRDs

### PRDs

A PRD folder uses `prd-<###>-<slug>/`, with an index named `prd-<###>-<slug>-index.md`. Optional sub-PRDs use alphabetical suffixes such as `prd-007a-<slug>-<feature>.md`. An optional ClickUp suffix may appear on the index filename only.

PRD numbers are repository-local and sequential. Before assigning a number, inspect PRD folders in all three lifecycle locations and use the highest existing number plus one.

### IRDs

An IRD folder uses `ird-<###>-<slug>/`, with an index named `ird-<###>-<slug>-index.md`. The number must match an existing GitHub issue number; never invent an IRD number.

### Lifecycle

Lifecycle is represented by the folder location:

| State                 | PRD location              | IRD location        |
| --------------------- | ------------------------- | ------------------- |
| Queued or not started | `requirements/backlog/`   | `issues/backlog/`   |
| Actively implemented  | `requirements/in-work/`   | `issues/in-work/`   |
| Shipped or resolved   | `requirements/completed/` | `issues/completed/` |

Move the entire plan folder when lifecycle changes, including its index, sub-documents, and `qa/` folder. Do not change frontmatter without moving the folder.

Numbers are three-digit zero-padded through `999` and use natural width thereafter. PRD and IRD sequences are independent, and duplicate numbers are not allowed across lifecycle locations.

## QA reports and ownership

QA report findings are authored only by `quality-guardian`. `library-guardian` owns the surrounding library structure and lifecycle moves but does not write QA findings.

- PRD QA reports live at `<prd-folder>/qa/prd-<###>-<slug>-qa.md`.
- IRD QA reports live at `<ird-folder>/qa/ird-<###>-<slug>-qa.md`.
- Standalone routine reports live under `library/requirements/reports/`; `quality-guardian`, `security-guardian`, or another responsible specialist authors their findings.

The `qa/` folder moves with its parent PRD or IRD. Do not create QA content in `library/qa/` or a generic `reports/` folder inside a plan.

## Knowledge documents

Knowledge documents use lowercase kebab-case filenames and live under an audience and domain, for example:

- `library/knowledge/public/guides/generation-and-storyboards.md`
- `library/knowledge/private/platform/runtime-data-and-providers.md`

Start with a clear title and a short category/version/date/status line when useful. Link related library documents with relative Markdown links. Cite the code and configuration paths that establish technical behavior.

## Writing and maintenance rules

1. Document confirmed, durable behavior from code and configuration; treat README text and comments as hints.
2. Keep each document focused and link to related material rather than duplicating it.
3. Use lifecycle location, not prose alone, to represent PRD and IRD status.
4. Prefer additive or surgical edits that preserve useful history and cross-references.
5. Keep every implementation document traceable to relevant source paths.
6. Only `wiki-guardian` may edit code-derived wiki entities; its driver owns wiki global-state files.
7. Never edit aggregated documentation mirrors.
8. Never write under `library/notes/`.
9. Never create new content in schema-v1 paths outside the wiki exception.

## Ownership

- `library-guardian` owns the schema-v2 structure, PRDs, IRDs, knowledge documents, cross-links, lifecycle moves, QA subfolders, and the `requirements/reports/` folder.
- `quality-guardian` exclusively owns QA report findings.
- `security-guardian` or another responsible specialist owns non-QA routine report findings.
- `wiki-guardian` owns code-derived pages under `library/knowledge-base/wiki/`; its driver owns global state.
- Humans exclusively own `library/notes/`.
- Project contributors review and maintain the substantive accuracy of repository documentation.
