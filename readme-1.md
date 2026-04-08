# 🎬 Cuedeck: Production-Grade Video Ad-Injection Platform

Cuedeck is a robust, scalable video processing and ad-injection platform designed to handle complex media workflows, resilient background jobs, and sophisticated frontend state management.

This project was engineered from the ground up with **production-readiness**, **scalability**, and **clean domain boundaries** as its primary goals. It is not merely a prototype, but a system designed with advanced architectural patterns capable of handling real-world concurrency and media processing demands.

---

Based on the comprehensive audit performed by the codebase investigator, here is the detailed architectural and quality review report for the cuedeck project:

## 🏗️ Architecture & Structural Design

The project exhibits a robust, well-structured architecture that closely follows Clean Architecture and Hexagonal Architecture principles.

* **Dependency Injection:** The application effectively decouples business logic from infrastructure using a manual Dependency Injection (DI) container (`src/lib/container.ts`). This is the composition root where all services and repositories are instantiated and wired together, allowing for easy swapping of implementations (e.g., switching between Local and R2 storage based on environment variables).
* **Domain Contracts:** There is a strong, centralized definition of domain types and schemas within the `src/contracts/` directory (e.g., `ad.schemas.ts`, `job.schemas.ts`, `generation.schemas.ts`). This ensures rigorous type safety and consistent validation across the application, particularly during job payload and result serialization.
* **Job System:** A sophisticated, custom durable job processing system is in place (`src/lib/jobs/`). It features polling, heartbeats, and utilizes PostgreSQL for concurrency control. The core business logic for heavy tasks, like video generation and transcription, is well-orchestrated within `JobProcessor.ts`.
* **Database Concurrency:** The database interaction patterns, specifically in `src/repositories/job/PrismaJobRepositoryImpl.ts`, demonstrate production-grade handling of concurrent job claiming using `FOR UPDATE SKIP LOCKED`.

## 🛡️ Code Quality & Best Practices

* **Type Safety & Validation:** The pervasive use of Zod for schema validation and TypeScript for static typing ensures high data integrity and catches errors at compile time or at the application boundaries.
* **Testing:** The presence of a vitest configuration (`vitest.config.mts`) and a `__tests__` directory indicates a commitment to automated testing, though specific test coverage would need further granular analysis.
* **Infrastructure Flexibility:** The system supports flexible storage backends (Local vs. Cloud R2) and cleanly integrates with external APIs such as OpenAI and Mux.

## 🚀 Recommendations for Production-Readiness

While the codebase is of high quality, the following areas should be addressed to ensure it is fully production-ready:

1. **Configuration Management:**
   * Currently, configuration and instantiation logic are heavily mixed in `container.ts`. It is recommended to move environment variable parsing and hardcoded configuration into a dedicated configuration service or class (e.g., using a library like envalid or a central Zod configuration schema) to ensure all config is validated at startup.
2. **Logging Strategy:**
   * The use of standard `console.log` (especially in the worker processes) is insufficient for a production environment. Implement a structured, JSON-based logging library such as Winston or Pino. This is crucial for observability, debugging, and integration with log aggregation services (like Datadog, ELK, or AWS CloudWatch).
3. **Dependency Injection Evolution:**
   * While the manual DI container works well currently, if the dependency graph grows significantly more complex, consider adopting a dedicated DI library like InversifyJS or TSyringe to manage lifecycles and reduce boilerplate.
4. **Resilience & Rate Limiting:**
   * Ensure that interactions with external APIs (like OpenAI and Mux) have robust retry strategies (e.g., exponential backoff) and rate-limiting handling. The job processor should gracefully handle third-party service degradation.
5. **Worker Lifecycle Management:**
   * The job worker autostart logic located in `container.ts` relies on environment variables. While this is a common pattern, it needs careful management if deployed in serverless environments (like Vercel functions), as background processes can be terminated unexpectedly. If moving to serverless, consider triggering jobs via webhooks or using a dedicated background task runner suited for that environment (like Vercel Inngest or Upstash).

Overall, the foundation of the cuedeck project is very solid and demonstrates modern, scalable architectural patterns.

---

## 🏗️ Detailed Architectural Choices

Based on my analysis of the codebase, here is a detailed breakdown of the key architectural choices made in the cuedeck project and the rationale behind them:

### 1. Hexagonal/Clean Architecture with Manual Dependency Injection (DI)
* **The Choice:** The project heavily utilizes interfaces (`I...Repository`, `I...Service`) defined in the `src/contracts` directory, with concrete implementations (like `PrismaJobRepositoryImpl`) injected into services via a central composition root (`src/lib/container.ts`).
* **The Why:** This pattern maximizes decoupling and testability. By programming to interfaces rather than concrete classes, the business logic (Services) is completely isolated from the infrastructure (Database, File System, External APIs). This allows the team to easily mock dependencies in tests or swap out entire technologies (e.g., migrating from Prisma to raw SQL, or changing transcription providers) without having to rewrite any core application logic.

### 2. Durable Job System using PostgreSQL (`FOR UPDATE SKIP LOCKED`)
* **The Choice:** Instead of introducing an external message broker or queue like Redis (e.g., BullMQ) or RabbitMQ, the project built a custom background job system directly on top of the primary PostgreSQL database (`src/repositories/job/PrismaJobRepositoryImpl.ts`).
* **The Why:** This choice significantly reduces operational complexity by removing the need to host and maintain a separate caching layer. The use of the advanced SQL feature `FOR UPDATE SKIP LOCKED` is the secret sauce here; it allows multiple worker processes to query the Job table simultaneously and "claim" different rows without causing database deadlocks or processing the same job twice. It provides robust concurrency control, retry logic, and heartbeat monitoring natively.

### 3. Zod for Pervasive Runtime Validation
* **The Choice:** The `src/contracts` layer makes extensive use of Zod schemas to define the shape of data models, particularly for things like JSON payloads in the database.
* **The Why:** TypeScript only provides compile-time safety. When reading unstructured JSON from a database (like the payload and result columns in the Job table) or receiving data from external APIs, that type safety is lost. Zod acts as a bridge, ensuring that the runtime data perfectly matches the expected TypeScript types. If a job payload is malformed, Zod catches it immediately, preventing unpredictable bugs deep within the processing logic.

### 4. Storage Abstraction (Local vs. Cloudflare R2)
* **The Choice:** The storage layer is abstracted behind an `IStorageRepository`. The DI container dynamically instantiates either a `LocalStorageRepositoryImpl` or an `R2StorageRepositoryImpl` based on the `STORAGE_PROVIDER` environment variable.
* **The Why:** This drastically improves the developer experience. Engineers can run the entire application locally using standard file system storage without needing to provision cloud buckets, manage AWS credentials, or run local S3 emulators like LocalStack. When deploying to production, simply flipping an environment variable switches the system over to Cloudflare R2, which provides highly scalable, S3-compatible edge storage with zero egress fees.

### 5. In-House Media Processing via FFmpeg
* **The Choice:** The application uses `ffmpeg-static` wrapped in custom processor classes (`FfmpegAudioProcessorImpl`, `FfmpegVideoProcessorImpl`) to handle media manipulation (audio extraction, video generation) natively within the worker.
* **The Why:** While the database schema indicates preparation for Mux (a third-party video streaming service), the actual heavy lifting of media processing is kept in-house. Relying on cloud APIs for complex video editing/generation can become prohibitively expensive very quickly. By orchestrating FFmpeg via the durable job system, the application maintains granular control over the output quality and avoids massive per-minute processing costs, scaling purely based on compute resources.

### 6. Complex Editor State via Command Pattern and React Context
* **The Choice:** The video editor (`src/context/editor/MarkerContext.tsx`) manages state using a custom Context that implements a pseudo-command pattern. It utilizes an internal `useUndoRedo` hook.
* **The Why:** Editing video markers requires precise, immediate visual feedback (optimistic UI updates) and the ability to undo mistakes. Because markers are persisted to a database (which has latency), the `MarkerContext` manages a "Snapshot" of the marker state. When a user creates or moves an ad marker, it immediately updates the local timeline, pushes a `do/undo` closure pair onto an undo stack, and then asynchronously syncs with the server.
* **Target Syncing Hack:** Because optimistic creation assigns a temporary frontend ID, and the server returns a permanent database ID, the system uses a `MarkerCommandTarget` (a mutable `useRef` map). This clever hack ensures that if a user creates a marker and then immediately hits "Undo" before the server responds, the Undo command still knows the correct final ID to delete once the server eventually returns it.

### 7. Client-Side Ad Resolution & State Machine (`useAdInjection.ts`)
* **The Choice:** The decision of which specific ad video to play when a marker is reached on the timeline is handled entirely on the client side using a custom hook (`useAdInjection.ts`).
* **The Why:** The application supports three types of ad markers: STATIC (always plays one ad), AUTO (picks a random ad from a pool), and AB (A/B testing, picking the ad with the lowest local play count). By pushing this resolution logic to the client during playback:
  * It avoids needing a constant network connection to ask the server "which ad should play next?".
  * It ensures zero latency when an ad needs to start playing (preventing buffering or black frames).
  * The state machine manages the complex transition of pausing the main video (`pause()`), swapping the `<video>` element source, tracking the ad's completion, and seamlessly resuming the main content (`resumeRef.current()`).

### 8. Domain-Driven Error Classification
* **The Choice:** The project implements a structured error hierarchy (e.g., `DomainError`, `NotFoundError`, `BusinessRuleError`, `InfrastructureError`).
* **The Why:** In a complex system, throwing generic `Error("Something went wrong")` makes debugging and user feedback difficult.
  * `BusinessRuleError` indicates the user tried to do something mathematically or logically impossible (e.g., "Cannot place an ad marker beyond the end of the video"). The API can catch this and safely return a 400 Bad Request with a helpful message.
  * `InfrastructureError` indicates a system failure (e.g., "Could not connect to Cloudflare R2"). This is mapped to a 500 Internal Server Error, triggers logging alerts, and is hidden from the user to prevent leaking system details.

### 9. Headless UI Architecture
* **The Choice:** Looking at the `package.json`, they are using `clsx`, `lucide-react`, and `@dnd-kit/core` combined with Tailwind CSS.
* **The Why:** Rather than relying on a heavy, pre-styled component library (like Material UI or Ant Design) which can be difficult to customize, the project favors a "headless" approach. They build their own accessible UI components using Tailwind for styling and specialized headless libraries (like `@dnd-kit` for the drag-and-drop timeline) for complex interactions. This results in a highly customized, performant editor interface without the bloat of unused CSS/JS.

### 10. Adaptive Bitrate Streaming (HLS) over Standard MP4
* **The Choice:** The project doesn't just serve simple `.mp4` files to the video player. It implements full support for HLS (HTTP Live Streaming) using `hls.js` on the frontend (`useVideoPlayer.ts`) and custom HLS playlist generation on the backend (`src/utils/hls.ts`).
* **The Why:** Serving a single massive MP4 file is terrible for user experience, especially on slower connections or mobile devices, as it causes constant buffering. HLS chops the video into tiny 2-3 second chunks (`.ts` files) at different quality levels (e.g., 1080p, 720p, 480p).
  * The `useVideoPlayer` hook dynamically detects if the browser natively supports HLS (like Safari) or needs `hls.js` to polyfill it.
  * The backend generates an `#EXTM3U` Master Playlist (`buildHlsMasterPlaylist`), allowing the player to seamlessly downgrade or upgrade video quality mid-stream without interrupting playback. This is the exact same technology used by Netflix and YouTube.

### 11. Centralized API Error Mapping (`toErrorResponse`)
* **The Choice:** Instead of having try/catch blocks in every single Next.js API route that manually format JSON responses, the project uses a centralized error handler (`src/app/api/_lib/errors.ts`).
* **The Why:** This guarantees that the frontend always receives errors in a predictable, consistent shape (e.g., `{ error: "Message" }`).
  * **Validation Errors:** It automatically catches `ZodError`s (from schema validation) and formats them into a clean 400 Bad Request.
  * **Business Logic:** It catches custom `DomainError`s and maps them to their respective HTTP status codes (like 404 or 409).
  * **Security:** If a fatal, unexpected error occurs (500 Internal Server Error), it logs the full stack trace securely to the console but only sends a generic "Internal server error" string to the client. This prevents leaking sensitive database queries or stack traces to malicious users in production.

### 12. "Soft" Deletes via Cascading Foreign Keys
* **The Choice:** In `prisma/schema.prisma`, relationships are explicitly defined with `onDelete: Cascade`. For example, a Marker is tied to an Episode, and a TranscriptSegment is tied to an Episode.
* **The Why:** Managing distributed state is hard. If a user deletes an Episode, you don't want orphaned Markers, Ad associations, or Transcript segments floating around in the database causing bugs or wasting space. By enforcing `onDelete: Cascade` at the database level, PostgreSQL automatically cleans up all associated child records the instant the parent is deleted. This removes the need for complex, multi-step transaction logic in the application code.

### 13. Dedicated Background Worker vs. Next.js Server Actions
* **The Choice:** The project includes a dedicated entry point for background jobs (`src/worker/jobs.ts`) that runs entirely independently of the Next.js web server via the `npm run jobs:worker` script (`tsx src/worker/jobs.ts`).
* **The Why:** Next.js (especially in serverless environments like Vercel) is not designed for long-running, CPU-intensive background tasks like video rendering or large file processing. A serverless function will time out after 10-60 seconds. By decoupling the DurableJobWorker into a standalone Node.js process, the system can:
  * Deploy the Next.js web app to a lightweight frontend host (Vercel, Netlify).
  * Deploy the worker to a heavy-compute container (AWS ECS, Render, Railway) where it can safely chew on a 30-minute video generation task without HTTP timeouts.

### 14. Server-Side Media URL Resolution Strategy
* **The Choice:** The database only stores the relative path or object key for media files (e.g., `episode.sourceUrl` might just be `episodes/123/video.mp4`), but the API intercepts this and dynamically resolves it to a full URL (`resolveEpisodeMediaUrl`) before returning the JSON to the frontend.
* **The Why:** This is a crucial security and flexibility pattern. If the project switches from a Local disk to Cloudflare R2, the database records don't need to change. The `StorageService` dynamically generates the correct base URL or even pre-signed/expiring URLs on the fly when the API is called. This prevents hardcoding cloud bucket URLs directly into the database schema.

### 15. Server State Management via React Query
* **The Choice:** The frontend leverages `@tanstack/react-query` (`src/app/providers.tsx` and custom hooks like `useMarkers`, `useEpisodes`) rather than `useEffect` fetching or complex Redux stores.
* **The Why:** React Query automatically handles the complexities of asynchronous server state:
  * **Caching:** It caches API responses so navigating back to the dashboard doesn't trigger a duplicate fetch.
  * **Invalidation:** When a user creates a new marker (`useMarkerMutations`), the mutation hook tells React Query to immediately invalidate the markers cache. This triggers a smart background re-fetch, guaranteeing the UI perfectly reflects the new database state without requiring a full page reload or manual state merging.

This concludes the deep dive! The architecture relies heavily on decoupling (Hexagonal structure), robust background processing (Custom Durable Worker), and sophisticated frontend state machines (React Query + Custom Contexts) to deliver a production-ready media platform.

---

## 🛠️ Getting Started

### Prerequisites
* Node.js 20+
* PostgreSQL (Local or hosted via Supabase/Neon)
* (Optional) Cloudflare R2 credentials for cloud storage
* (Optional) OpenAI API Key for Whisper transcription

### Setup

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy the sample environment file and configure your database connection string.
   ```bash
   cp .env.example .env
   ```

3. **Database Migration**
   Apply the Prisma schema to your PostgreSQL database.
   ```bash
   npx prisma migrate dev
   ```

4. **Run the Application**
   You need to run *both* the web server and the background job worker to process media.

   *Terminal 1 (Web UI):*
   ```bash
   npm run dev
   ```

   *Terminal 2 (Background Job Worker):*
   ```bash
   npm run jobs:worker
   ```