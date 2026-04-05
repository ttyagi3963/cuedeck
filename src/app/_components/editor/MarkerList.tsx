import type { Marker } from "@/contracts/marker";
import MarkerRow from "./MarkerRow";

type MarkerListProps = {
  markers: Marker[];
  onDeleteMarker: (markerId: string) => void;
};

export default function MarkerList({
  markers,
  onDeleteMarker,
}: MarkerListProps) {
  if (markers.length === 0) {
    return (
      <p className="px-marker-list-padding-x py-marker-list-empty-padding-y text-sm text-text-muted">
        No markers yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-marker-list-gap px-marker-list-padding-x">
      {markers.map((marker, index) => (
        <MarkerRow
          key={marker.id}
          marker={marker}
          index={index}
          onDelete={() => onDeleteMarker(marker.id)}
        />
      ))}
    </div>
  );
}
