"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import type { Marker } from "@/contracts/marker";
import { useEditor } from "@/context/EditorContext";
import MarkerRow from "./MarkerRow";

type MarkerListProps = {
  markers: Marker[];
  onDeleteMarker: (markerId: string) => void;
};

export default function MarkerList({
  markers,
  onDeleteMarker,
}: MarkerListProps) {
  const { moveMarker, suppressAdChecks, unsuppressAdChecks, openEditDialog } =
    useEditor();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      unsuppressAdChecks();
      return;
    }

    const oldIndex = markers.findIndex((m) => m.id === active.id);
    const newIndex = markers.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      unsuppressAdChecks();
      return;
    }

    const times = markers.map((m) => m.timeSec);

    const reordered = [...markers];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updates: { markerId: string; timeSec: number }[] = [];
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].timeSec !== times[i]) {
        updates.push({ markerId: reordered[i].id, timeSec: times[i] });
      }
    }

    for (const u of updates) {
      moveMarker(u.markerId, u.timeSec);
    }

    unsuppressAdChecks();
  }

  if (markers.length === 0) {
    return (
      <p className="px-marker-list-padding-x py-marker-list-empty-padding-y text-sm text-text-muted">
        No markers yet
      </p>
    );
  }

  return (
    <DndContext
      id="marker-list-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={suppressAdChecks}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={markers.map((m) => m.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex max-h-[200px] flex-col gap-marker-list-gap overflow-y-auto px-marker-list-padding-x">
          {markers.map((marker, index) => (
            <MarkerRow
              key={marker.id}
              marker={marker}
              index={index}
              onDelete={() => onDeleteMarker(marker.id)}
              onEdit={() => openEditDialog(marker)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
