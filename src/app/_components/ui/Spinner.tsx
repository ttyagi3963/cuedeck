type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-3",
} as const;

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-zinc-300 border-t-red-600 ${SIZE_CLASSES[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
