export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDurationShort(seconds: number): string {
  return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
}

export function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const TIME_REGEX = /^\d{2}:\d{2}:\d{2}$/;

/** Parse a strict HH:MM:SS string into seconds. Returns null if invalid. */
export function parseTime(input: string): number | null {
  const trimmed = input.trim();
  if (!TIME_REGEX.test(trimmed)) return null;

  const [h, m, s] = trimmed.split(":").map(Number);
  if (h < 0 || m < 0 || m >= 60 || s < 0 || s >= 60) return null;
  return h * 3600 + m * 60 + s;
}

/** Returns true if the input matches HH:MM:SS with valid ranges. */
export function isValidTime(input: string): boolean {
  return parseTime(input) !== null;
}
