"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Button from "@/app/_components/ui/Button";
import Input from "@/app/_components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { useUploadAd, useUploadEpisode } from "@/hooks/useUploadMedia";
import { UPLOAD_MEDIA_FORM_COPY } from "@/lib/constants";
import { getVideoDuration } from "@/utils/video";

type UploadMediaFormProps = {
  kind: "episode" | "ad";
  id?: string;
  className?: string;
  showHeader?: boolean;
  onSuccess?: () => void;
};

type FieldErrors = {
  title: boolean;
  file: boolean;
};

export default function UploadMediaForm({
  kind,
  id,
  className = "",
  showHeader = true,
  onSuccess,
}: UploadMediaFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    title: false,
    file: false,
  });

  const copy = UPLOAD_MEDIA_FORM_COPY[kind];
  const uploadEpisodeMutation = useUploadEpisode();
  const uploadAdMutation = useUploadAd();
  const isPending =
    kind === "episode"
      ? uploadEpisodeMutation.isPending
      : uploadAdMutation.isPending;

  function reset() {
    setTitle("");
    setCompanyName("");
    setFile(null);
    setSelectedFileName("");
    setUploadProgress(null);
    setFormErrors([]);
    setFieldErrors({ title: false, file: false });
  }

  function setValidationErrors(nextErrors: string[], nextFieldErrors: FieldErrors) {
    setFormErrors(nextErrors);
    setFieldErrors(nextFieldErrors);
  }

  function validateForm() {
    const nextFieldErrors: FieldErrors = {
      title: title.trim().length === 0,
      file: !file,
    };

    const nextErrors: string[] = [];
    if (nextFieldErrors.title) {
      nextErrors.push("Title is required");
    }
    if (nextFieldErrors.file) {
      nextErrors.push("Video file is required");
    }

    setValidationErrors(nextErrors, nextFieldErrors);

    return nextErrors.length === 0;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = e.target.files?.[0] ?? null;
    setFile(nextFile);
    setSelectedFileName(nextFile?.name ?? "");
    setUploadProgress(null);
    if (nextFile) {
      setFieldErrors((prev) => ({ ...prev, file: false }));
      setFormErrors((prev) => prev.filter((error) => error !== "Video file is required"));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const selectedFile = file;
    if (!selectedFile) {
      return;
    }

    const trimmedTitle = title.trim();

    void (async () => {
      try {
        const duration = await getVideoDuration(selectedFile);
        setUploadProgress(0);

        if (kind === "episode") {
          await uploadEpisodeMutation.mutateAsync({
            title: trimmedTitle,
            file: selectedFile,
            duration,
            onProgress: setUploadProgress,
          });
        } else {
          await uploadAdMutation.mutateAsync({
            title: trimmedTitle,
            companyName,
            file: selectedFile,
            duration,
            onProgress: setUploadProgress,
          });
        }

        reset();
        toast(copy.successLabel);
        router.refresh();
        onSuccess?.();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        setUploadProgress(null);
        setFormErrors([message]);
        toast(message, "error");
      }
    })();
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className={clsx(
        "flex flex-col gap-content-gap-sm",
        showHeader
          ? "rounded-ad-markers border border-border-default bg-surface p-5"
          : "",
        className,
      )}
    >
      {showHeader && (
        <div className="flex flex-col gap-content-gap-xxs">
          <h2 className="text-lg font-bold text-text-heading">{copy.title}</h2>
          <p className="text-sm text-text-muted">{copy.description}</p>
        </div>
      )}

      {formErrors.length > 0 && (
        <div className="rounded-button-primary border border-danger/30 bg-notification-badge/10 px-3 py-2">
          {formErrors.map((error) => (
            <p key={error} className="text-xs font-medium text-text-danger-subtle">
              {error}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-content-gap-2-5">
        <label className="text-sm font-medium text-text-heading">
          {copy.nameLabel}
        </label>
        <Input
          variant={fieldErrors.title ? "error" : "default"}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) {
              setFieldErrors((prev) => ({ ...prev, title: false }));
              setFormErrors((prev) =>
                prev.filter((error) => error !== "Title is required"),
              );
            }
          }}
          placeholder={kind === "episode" ? "Episode title" : "Ad title"}
        />
      </div>

      {kind === "ad" && (
        <div className="flex flex-col gap-content-gap-2-5">
          <label className="text-sm font-medium text-text-heading">
            {copy.kind === "ad" ? copy.companyLabel : ""}
          </label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Optional company name"
          />
        </div>
      )}

      <div className="flex flex-col gap-content-gap-2-5">
        <label className="text-sm font-medium text-text-heading">
          {copy.fileLabel}
        </label>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className={clsx(
            "rounded-button-primary bg-background-page px-3 py-2 text-sm text-text-heading file:mr-3 file:rounded-button-primary file:border-0 file:bg-background-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-on-primary",
            fieldErrors.file
              ? "border border-danger"
              : "border border-border-default",
          )}
        />
        {selectedFileName && (
          <p className="text-xs text-text-muted">{selectedFileName}</p>
        )}
      </div>

      {isPending && uploadProgress !== null && (
        <div className="rounded-dialog border border-border-default bg-background-page p-content-p-sm text-sm text-text-muted">
          <div className="flex items-center justify-between gap-content-gap-sm">
            <p className="font-semibold text-text-heading">
              {uploadProgress >= 100 ? "Finalizing upload" : "Uploading video"}
            </p>
            <span className="rounded-full bg-trend-positive/10 px-3 py-1 text-base font-bold text-trend-positive">
              {uploadProgress}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-trend-positive/20">
            <div
              className="h-full rounded-full bg-trend-positive transition-[width] duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <Button
        variant={isPending ? "disabled" : "primary"}
        disabled={isPending}
        type="submit"
      >
        {isPending
          ? uploadProgress !== null && uploadProgress >= 100
            ? "Finalizing..."
            : "Uploading..."
          : copy.submitLabel}
      </Button>
    </form>
  );
}
