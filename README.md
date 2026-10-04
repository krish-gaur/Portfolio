# Krish OS — portfolio system

A data-driven, single-page portfolio built with Next.js App Router, React, and TypeScript. The existing navigation, responsive project system, timelines, technology map, motion design, and holographic assistant remain in place. The assistant uses a restrained abstract signal until a real portrait reference is supplied; it does not invent a face.

## Run locally

```bash
npm install
npm run dev
```

The site works without API keys. Local chat answers from the portfolio and the general topics in `data/portfolio.json`; open-ended conversation uses the optional server-side LLM provider. Voice input uses browser speech recognition where available. Speech output uses server-side OpenAI TTS when configured, with browser speech synthesis as a fallback.

## Optional AI provider

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` on the server only. Never add the key to a `NEXT_PUBLIC_*` variable. `OPENAI_MODEL` can select the chat model. Chat history is bounded to recent turns, and the server retrieves only the portfolio records relevant to each turn (profile, projects, experience, achievements, skills, education, resume context, or links). If the provider is unavailable, the grounded local mode remains available. `/api/voice` optionally uses server-side OpenAI text-to-speech and falls back to browser speech synthesis.

## Update portfolio content

**`/data/portfolio.json` is the single source of truth for personal information and portfolio content.** Update the JSON, not the presentation components.

- Edit `profile` for the introduction, focus, availability, portrait path, and resume configuration.
- The supplied portrait is art-directed as a restrained holographic image at `public/avatar/krish-hologram.webp`; `profile.avatar.portrait` points to it. The generated treatment keeps the supplied likeness and does not create a replacement face.
- The supplied six-page resume package includes internal audit/draft pages. The public-facing PDF at `public/resume/krish-gaur-resume.pdf` is an unmodified extraction of its first two clean resume pages; the later audit/draft pages are not exposed. `profile.resume.url` and `fileName` drive the view/download actions. The app does not recreate the resume as HTML. Resume summary, skills, experience, project highlights, achievements and `ai_context` are grounded in those same pages. The PDF is not parsed at runtime, so refresh these JSON fields when replacing the document.
- Add projects by copying an object in `projects`. The schema supports short and long descriptions, category/metadata, problem and approach, status, technologies, features, architecture/workflow, challenges, AI components, achievements, screenshots, and separate `deployment` / `github` action-link objects. Leave unsupported facts and URLs empty; absent links and screenshots are hidden. Only put verified implementation stack items in `technologies`.
- `ai.system_personality`, the welcome, suggested questions, local fallback replies, and `ai.general_topics` are also configured in the JSON. The server-side LLM may discuss general topics; personal facts remain grounded in retrieved portfolio records.
- Experience, competition results, education, achievements, roles, skills, social links, and contact routes are data-driven.
- Add `meta.siteUrl` only when the production domain is known.

The schema is documented in `types/portfolio.ts`. Do not invent an asset, URL, project metric, or resume detail to fill a blank field.

## Quality checks

```bash
npm run typecheck
npm run build
```
