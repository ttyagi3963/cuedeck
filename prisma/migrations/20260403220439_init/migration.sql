-- CreateEnum
CREATE TYPE "MarkerType" AS ENUM ('STATIC', 'AUTO', 'AB');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('TRANSCRIBE', 'WAVEFORM');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MuxAssetStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'ERRORED');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "episodeId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marker" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "timeSec" DOUBLE PRECISION NOT NULL,
    "type" "MarkerType" NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptSegment" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "muxAssetId" TEXT,
    "muxPlaybackId" TEXT,
    "muxStatus" "MuxAssetStatus" NOT NULL DEFAULT 'PENDING',
    "waveformUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkerAd" (
    "id" TEXT NOT NULL,
    "markerId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "playCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarkerAd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TranscriptSegment_episodeId_startTime_idx" ON "TranscriptSegment"("episodeId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "MarkerAd_markerId_adId_key" ON "MarkerAd"("markerId", "adId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marker" ADD CONSTRAINT "Marker_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkerAd" ADD CONSTRAINT "MarkerAd_markerId_fkey" FOREIGN KEY ("markerId") REFERENCES "Marker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkerAd" ADD CONSTRAINT "MarkerAd_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
