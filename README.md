# CueDeck

CueDeck is a production-ready video podcast editor for uploading episodes and ad creatives, placing timeline-based ad markers, generating a final stitched video, packaging it as adaptive HLS, and navigating long-form content with transcript-assisted scrubbing.

This project was built to demonstrate more than just UI polish. The core goal was to show production-minded engineering choices around media workflows, background processing, storage abstraction, and editor state management.

## Core Page Requirements

The grading prompt emphasized making the editor page fully work as a real full-stack product surface, not just building isolated features. This implementation covers that core flow first:

- [x] Full-stack editor page with marker CRUD backed by PostgreSQL
- [x] Every core playback control functions: play/pause, undo/redo, skip, jump to start/end
- [x] Video player and timeline stay in sync while scrubbing
- [x] Video slider is draggable
- [x] Waveform zoom works
- [x] Ad markers are draggable and editable
- [x] Video plays the source content and injects ads during playback at marker points
- [x] Spacebar toggles playback page-wide
- [x] Sidebar shell exists with hover states
- [x] The implementation prioritizes code quality, testable boundaries, and maintainability over one-off hacks

## Bonus Points Implemented

Beyond the core editor requirements, the project also implements the bonus pipeline work in the same order as the prompt:

1. [x] Allow video upload and ad uploads
2. [x] Add real waveforms
3. [x] Build the actual dynamic ad injection / generation (final MP4 generation)
4. [x] Build 4-quality HLS output for the generated final video
5. [x] Build audio extraction + transcription + transcript-assisted scrubbing UI
6. [x] Document a production hosting strategy for web, worker, storage, and HLS delivery
7. [x] Add reliability / durable execution to the transcription and generation pipelines

Implementation notes:

- The waveform is real and rendered from actual media audio in the browser today.
- The HLS output is generated from the final stitched video; ads are baked into the rendered asset before packaging.
- Durable retries currently restart a generation job from the beginning rather than resuming from a stage checkpoint.

## Architecture Overview

CueDeck is split into a lightweight web application and a dedicated media worker:

```text
Browser
  -> Next.js App Router UI + API routes
  -> PostgreSQL (episodes, ads, markers, jobs, transcripts)
  -> Cloudflare R2 / local storage (source media + generated outputs)
  -> Dedicated worker (transcription + FFmpeg rendering + HLS packaging)
```

At a code level, the project follows a clean, hexagonal shape:

```text
UI / Routes -> Services -> Repositories / Providers -> Infrastructure
```

That separation is what makes it possible to:

- run locally on filesystem storage
- switch to Cloudflare R2 in production
- keep the business logic independent of Prisma, FFmpeg, and OpenAI
- test service logic without binding everything to framework code

## Key Engineering Decisions

### 1. Design System as a First-Class Architecture Decision

The UI is not treated as one-off page styling. CueDeck uses a small internal design system built around reusable primitives, semantic tokens. The semantics tokens then form the tailwind theme.

### 2. Hexagonal Architecture with Manual Dependency Injection

The app uses interface-first boundaries across repositories and services, with a central composition root in `src/lib/container.ts`. This is especially valuable in a media app, where infrastructure often changes faster than core product logic.

### 3. Durable Background Jobs on PostgreSQL

Instead of keeping video generation and transcription in-process, CueDeck persists jobs in PostgreSQL and processes them via a dedicated worker entrypoint in `src/worker/jobs.ts`.

### 4. Storage Abstraction: Local vs. Cloudflare R2

Media storage is abstracted behind `IStorageRepository`, with two implementations:

- `LocalStorageRepositoryImpl`
- `R2StorageRepositoryImpl`

### 5. Direct Browser-to-Storage Uploads

Uploads do not proxy large media through the Next.js app server. Instead, the browser requests an upload target, uploads directly to storage, and then creates the database record.

### 6. In-House Media Processing with FFmpeg

CueDeck uses FFmpeg-based processors for:

- transcript audio preparation
- final MP4 generation
- HLS packaging

The render pipeline creates a final stitched MP4 first, then produces adaptive HLS renditions from that output.

### 7. Non-Blocking Editor UX with Durable State Restoration

When a user starts generation, the editor no longer traps them in a modal waiting for completion. The job runs in the background, the UI shows status non-blockingly, and the editor restores the latest generation state from the database on return.

### 8. Strong Runtime Validation with Zod

Contracts use Zod schemas heavily, especially around job payloads/results and API input validation.

### 9. Editor State Is Split Intentionally

The editor uses a mix of:

- React Query for server state
- React Context for playback/editor coordination
- command-style undo/redo behavior for marker operations

## Repository Structure

```text
cuedeck/
|- prisma/
|  |- schema.prisma
|  `- seed.ts
|- public/
|- src/
|  |- app/
|  |  |- api/
|  |  |- editor/
|  |  `- _components/
|  |     |- dashboard/
|  |     |- editor/
|  |     |- navigation/
|  |     |- ui/
|  |     `- upload/
|  |- context/
|  |  `- editor/
|  |- contracts/
|  |  |- ad/
|  |  |- episode/
|  |  |- errors/
|  |  |- generation/
|  |  |- job/
|  |  |- marker/
|  |  |- storage/
|  |  |- transcript/
|  |  `- video/
|  |- hooks/
|  |- lib/
|  |  |- errors/
|  |  |- jobs/
|  |  |- media/
|  |  |- pipeline/
|  |  `- storage/
|  |- repositories/
|  |  |- ad/
|  |  |- episode/
|  |  |- job/
|  |  |- marker/
|  |  |- storage/
|  |  `- transcript/
|  |- services/
|  |  |- ad/
|  |  |- audio/
|  |  |- episode/
|  |  |- generation/
|  |  |- job/
|  |  |- marker/
|  |  |- storage/
|  |  |- transcript/
|  |  |- transcription/
|  |  `- video/
|  |- styles/
|  |- utils/
|  `- worker/
|     `- jobs.ts
|- __tests__/
`- package.json
```

## Folder Responsibilities and Guardrails

This section is intentionally strict. If someone extends the system later, these boundaries should hold.

### `prisma/`

Owns:

- persistent schema
- relations and cascade behavior
- seed data

Guardrails:

- treat `schema.prisma` as the database source of truth
- do not hide business rules in Prisma queries if they belong in services
- any schema change should be reflected in contracts and mappers

### `src/contracts/`

Owns:

- domain types
- runtime validation schemas
- stable business contracts between layers

Guardrails:

- this folder is the semantic source of truth for domain shapes
- if a payload/result crosses a boundary, define it here first
- do not import framework concerns into contracts
- be careful changing schemas here: downstream repositories, services, routes, and workers depend on them

### `src/repositories/`

Owns:

- persistence adapters
- mapping database rows and storage APIs into domain objects

Guardrails:

- repositories should not contain business policy
- no UI concerns
- no orchestration of multiple subsystems unless it is truly persistence-related

### `src/services/`

Owns:

- business workflows
- orchestration across repositories/providers
- application rules

Guardrails:

- services should depend on interfaces, not concrete infrastructure
- this is the right layer for product logic
- keep framework-specific code out of here

### `src/lib/`

Owns:

- composition root
- durable job machinery
- media pipeline implementation
- cross-cutting infrastructure helpers

Guardrails:

- `container.ts` is the assembly point, not a dumping ground for business logic
- `lib/jobs` should remain focused on durable execution mechanics
- `lib/pipeline` should remain focused on FFmpeg/media concerns

### `src/app/`

Owns:

- Next.js routes
- server-rendered pages
- route-level metadata
- API boundary formatting

Guardrails:

- routes should validate, call services, and return responses
- keep heavy business logic out of route handlers
- UI components under `app/_components` should stay presentation-focused where possible

### `src/context/`

Owns:

- editor coordination state
- playback, marker, and dialog orchestration

Guardrails:

- use context for editor interaction state, not server persistence
- anything durable or shared across navigation should live in the database or React Query

### `src/hooks/`

Owns:

- React Query hooks
- playback hooks
- editor behavior hooks

Guardrails:

- hooks should compose behavior cleanly, not become mini-services
- keep API fetching and cache invalidation here when it is client-specific

### `src/worker/`

Owns:

- standalone worker entrypoint

Guardrails:

- this process must remain runnable independently of the web server
- long-running media work belongs here, not in request/response handlers

### `src/utils/`

Owns:

- pure helper functions

Guardrails:

- if a helper starts needing repositories, services, or framework state, it probably belongs elsewhere

### `src/styles/`

Owns:

- design tokens
- shared global styling primitives

Guardrails:

- prefer semantic tokens over scattered one-off values
- changes here affect the whole UI surface

### `__tests__/`

Owns:

- focused regression coverage around the risky pieces

Guardrails:

- prioritize business logic, storage abstraction, and job execution paths
- avoid over-testing framework internals

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

At minimum, local development uses:

```env
DATABASE_URL=...
OPENAI_API_KEY=...
OPENAI_TRANSCRIPTION_MODEL=whisper-1

STORAGE_PROVIDER=local
```

For Cloudflare R2:

```env
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PRIVATE_BUCKET=...
R2_PUBLIC_BUCKET=...
R2_PUBLIC_BASE_URL=...
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
```

### 3. Run the app

```bash
npm run dev
```

### 4. Run the worker

```bash
npm run jobs:worker
```

The worker is required for:

- transcription
- final video generation
- HLS packaging

## Hosting Strategy

FlightCast/CueDeck is not a simple CRUD app; it has two very distinct workloads. The Next.js frontend needs to
serve web requests instantly globally, while the background worker (jobs:worker) needs to run heavy,
long-lived CPU tasks (FFmpeg video encoding) without timing out. Decoupling for Scale.

1. The web app
   I would host the Next.js product surface on Vercel. It is a strong fit for the editor UI, dashboard,
   lightweight API routes, previews, and global delivery. The frontend benefits from fast builds, good
   CDN behavior, and easy Git-based deployment.

2. The background worker
   I would run npm run jobs:worker as a separate always-on worker service on Render, Railway, or ECS.
   Video generation and transcription are long-running, CPU-heavy workloads, and they do not belong in
   a serverless request lifecycle. Keeping the worker separate allows FFmpeg and transcription jobs
   to run to completion without web request timeouts.

3. The database
   I would use managed PostgreSQL through Supabase or Neon. In this project,
   Postgres is not just the application database, it is also the durable job backbone.
   That makes connection pooling and reliability especially important.
4. Media storage and HLS delivery
   I would store originals, generated MP4s, playlists, and HLS segments in Cloudflare R2, fronted by
   Cloudflare delivery. This is the most important hosting choice for the streaming side of the system.
   HLS playback depends on serving many small playlist and segment files quickly, and R2 is attractive
   here because it avoids the egress costs that make S3-based video delivery expensive at scale.

I wouldn't just throw the whole thing on a single DigitalOcean VPS. By decoupling the static web serving (Vercel) from
the heavy compute tasks (Render) and utilizing zero-egress edge storage (Cloudflare R2) for the HLS chunks, the
architecture achieves high availability, protects against serverless timeouts, and keeps bandwidth costs predictable
even if a video goes viral.
