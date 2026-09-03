# Context Management For Future AI Work

Last updated: 2026-09-03

## Goal

Future modifications should use the least possible context while still being correct.

This project should not depend on reading a long chat history. The repository itself must carry enough compact context for maintenance.

## Research Notes

The current structure follows common guidance from:

- AGENTS.md: keep a predictable file for coding-agent instructions.
- README best practices: keep the main README concise, explain what the project does, how to run it and how to deploy it.
- ADR practice: record important decisions with context and consequences, not every small implementation detail.
- Recent research on agent context files: unnecessary or bloated context can increase cost and reduce task success, so context should be minimal and task-relevant.

## Required Reading Order

For small changes:

1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. The directly affected source file

For feature changes:

1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/VERSION_HISTORY.md`
4. Relevant files listed in `docs/PROJECT_CONTEXT.md`

For schema changes:

1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `supabase.sql`
4. `src/lib/types.ts`
5. The affected hook/component

## What Not To Do

- Do not read old chat history by default.
- Do not open every source file to understand a small bug.
- Do not add large product essays into `AGENTS.md`.
- Do not duplicate the same rules across too many files.
- Do not push or deploy unless the user explicitly asks.

## When Updating Context

Update `docs/PROJECT_CONTEXT.md` when any of these change:

- data model
- route structure
- core business logic
- date/finance calculation rules
- authentication or security assumptions
- deployment assumptions
- major UI interaction decisions

Update `docs/VERSION_HISTORY.md` only when a version is considered stable or a major feature group is completed.

## Suggested Prompt For Future Small Fixes

```text
Read AGENTS.md and docs/PROJECT_CONTEXT.md only. Then inspect the directly affected file and make the smallest safe change. Do not read old chat history. Do not push or deploy unless I explicitly ask.
```

