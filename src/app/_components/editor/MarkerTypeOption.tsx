import type { MarkerType } from "@/contracts/marker";
import Input from "@/app/_components/ui/Input";
import { MARKER_TYPE_META, MARKER_TYPE_ICONS } from "./markerUi";

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

  // Mirrors the ad-library row style: neutral border by default, ring +
  // subtle tinted bg when selected, hover darkens the border. Gives the
  // type-picker the same tactile feel as the ad picker step that follows.
  return (
    <label
      className={`flex cursor-pointer items-center gap-content-gap-sm rounded-dialog border px-marker-row-padding-x py-marker-row-padding-y transition-colors ${
        selected
          ? "border-border-active bg-background-page"
          : "border-border-default hover:border-border-subtle"
      }`}
    >
      <Icon />
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-semibold text-text-heading">
          {meta.label}
        </span>
        <span className="text-sm text-text-muted">{meta.description}</span>
      </div>
      <Input
        variant="radio"
        type="radio"
        name="markerType"
        value={type}
        checked={selected}
        onChange={onSelect}
      />
    </label>
  );
}
