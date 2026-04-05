import { MARKER_TYPE_META, type Marker } from "@/contracts/marker";
import { Trash } from "@/app/_components/ui/icons";
import Button from "@/app/_components/ui/Button";
import { formatTimestamp } from "@/utils/time";

type MarkerRowProps = {
  marker: Marker;
  index: number;
  onDelete: () => void;
};

export default function MarkerRow({ marker, index, onDelete }: MarkerRowProps) {
  return (
    <div className="flex h-marker-row-height items-center gap-marker-row-gap rounded-marker-row border border-border-default px-marker-row-padding-x py-marker-row-padding-y">
      <span className="w-4 text-sm text-text-muted">{index + 1}</span>
      <span className="rounded border border-border-default px-3 py-1 font-mono text-sm text-text-heading">
        {formatTimestamp(marker.timeSec)}
      </span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${MARKER_TYPE_META[marker.type].badgeClass}`}
      >
        {MARKER_TYPE_META[marker.type].shortLabel}
      </span>
      <Button variant="ghost" className="ml-auto text-sm">
        Edit
      </Button>
      <Button variant="danger" onClick={onDelete}>
        <Trash />
      </Button>
    </div>
  );
}
