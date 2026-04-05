import type { MarkerType } from "@/contracts/marker";
import { MARKER_TYPE_META, MARKER_TYPE_ICONS } from "@/contracts/marker";

type MarkerTypeOptionProps = {
  type: MarkerType;
  selected: boolean;
  onSelect: () => void;
};

export default function MarkerTypeOption({
  type,
  selected,
  onSelect,
}: MarkerTypeOptionProps) {
  const meta = MARKER_TYPE_META[type];
  const Icon = MARKER_TYPE_ICONS[type];

  return (
    <label className="flex cursor-pointer items-center gap-content-gap-sm rounded-marker-row border border-border-default px-marker-row-padding-x py-marker-row-padding-y">
      <Icon />
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium text-text-heading">
          {meta.label}
        </span>
        <span className="text-sm text-text-muted">{meta.description}</span>
      </div>
      <input
        type="radio"
        name="markerType"
        value={type}
        checked={selected}
        onChange={onSelect}
        className="size-5 accent-background-primary"
      />
    </label>
  );
}
