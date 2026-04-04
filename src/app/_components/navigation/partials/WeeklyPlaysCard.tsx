export default function WeeklyPlaysCard() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border-default bg-surface p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-2">
            <span className="border-b border-dashed border-border-subtle text-base font-semibold leading-base text-text-heading">
              Weekly plays
            </span>
            <span className="text-lg font-extrabold leading-lg text-text-heading">
              738,849
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="stroke-trend-positive"
            >
              <path
                d="M8 3.33v9.34M3.33 8l4.67-4.67L12.67 8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-base font-bold text-text-muted">17%</span>
          </div>
        </div>

        <svg
          viewBox="0 0 224 90"
          className="h-[90px] w-full"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(138, 249, 178, 0.34)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
          <path
            d="M0,70 L28,60 56,65 84,45 112,50 140,30 168,35 196,20 224,10 L224,90 L0,90 Z"
            fill="url(#chart-fill)"
          />
          <polyline
            fill="none"
            stroke="#16A34A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="0,70 28,60 56,65 84,45 112,50 140,30 168,35 196,20 224,10"
          />
        </svg>
      </div>

      <div className="flex justify-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-text-heading" />
        <span className="h-1.5 w-1.5 rounded-full bg-border-default" />
        <span className="h-1.5 w-1.5 rounded-full bg-border-default" />
      </div>
    </div>
  );
}
