type NavTooltipProps = {
  label: string;
};

export default function NavTooltip({ label }: NavTooltipProps) {
  return (
    <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 hidden lg:flex opacity-0 transition-opacity group-hover:opacity-100">
      <div className="whitespace-nowrap rounded bg-background-tooltip px-2.5 py-1 text-xs font-medium text-text-on-primary shadow-lg">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-800" />
      </div>
    </div>
  );
}
