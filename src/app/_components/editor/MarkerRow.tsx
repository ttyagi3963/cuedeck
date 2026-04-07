import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { MARKER_TYPE_META, type Marker } from "@/contracts/marker";
import { Trash } from "@/app/_components/ui/icons";
import Button from "@/app/_components/ui/Button";
import { formatTimestamp } from "@/utils/time";

type MarkerRowProps = {
  marker: Marker;
  index: number;
  onDelete: () => void;
  onEdit: () => void;
};

export default function MarkerRow({
  marker,
  index,
  onDelete,
  onEdit,
}: MarkerRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: marker.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    animationDelay: `${index * 50}ms`,
    animationFillMode: "backwards" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex h-marker-row-height items-center gap-marker-row-gap rounded-marker-row border border-border-default px-marker-row-padding-x py-marker-row-padding-y transition-shadow duration-200 hover:border-border-subtle hover:shadow-sm animate-in fade-in slide-in-from-left-2 ${isDragging ? "drag-active z-10 opacity-90 shadow-lg" : ""}`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center text-text-muted transition-colors duration-150 hover:text-text-heading active:cursor-grabbing"
        style={{ touchAction: "none" }}
        aria-label="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>
      <span className="w-4 text-sm text-text-muted">{index + 1}</span>
      <span className="rounded border border-border-default px-3 py-1 font-mono text-sm text-text-heading">
        {formatTimestamp(marker.timeSec)}
      </span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${MARKER_TYPE_META[marker.type].badgeClass}`}
      >
        {MARKER_TYPE_META[marker.type].shortLabel}
      </span>
      <Button variant="ghost" className="ml-auto text-sm" onClick={onEdit}>
        Edit
      </Button>
      <Button variant="danger" onClick={onDelete}>
        <Trash />
      </Button>
    </div>
  );
}
