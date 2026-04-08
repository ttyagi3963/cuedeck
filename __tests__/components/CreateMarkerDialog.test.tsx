import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateMarkerDialog from "@/app/_components/editor/CreateMarkerDialog";
import type { MarkerType } from "@/contracts/marker";

// Mock useAds hook used inside AdPickerStep
vi.mock("@/hooks/useAds", () => ({
  useAds: () => ({
    data: [
      {
        id: "a1",
        title: "Ad One",
        companyName: "Acme",
        videoUrl: "/ads/1.mp4",
        duration: 30,
        createdAt: new Date().toISOString(),
      },
      {
        id: "a2",
        title: "Ad Two",
        companyName: null,
        videoUrl: "/ads/2.mp4",
        duration: 15,
        createdAt: new Date().toISOString(),
      },
    ],
    isLoading: false,
  }),
}));

describe("CreateMarkerDialog", () => {
  let onClose: ReturnType<typeof vi.fn<() => void>>;
  let onConfirm: ReturnType<typeof vi.fn<(type: MarkerType, adIds: string[]) => void>>;
  let onAutoCreate: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    onClose = vi.fn<() => void>();
    onConfirm = vi.fn<(type: MarkerType, adIds: string[]) => void>();
    onAutoCreate = vi.fn<() => void>();
  });

  function renderDialog() {
    return render(
      <CreateMarkerDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        onAutoCreate={onAutoCreate}
        currentTime={65}
      />,
    );
  }

  it("renders the type selection step with all three marker types", () => {
    renderDialog();

    expect(screen.getByText("Static")).toBeInTheDocument();
    expect(screen.getByText("Auto")).toBeInTheDocument();
    expect(screen.getByText("A/B test")).toBeInTheDocument();
  });

  it("displays the marker timestamp in subtitle", () => {
    renderDialog();
    expect(screen.getByText(/00:01:05/)).toBeInTheDocument();
  });

  it("calls onAutoCreate and closes when AUTO is selected and confirmed", () => {
    renderDialog();

    fireEvent.click(screen.getByText("Auto"));
    fireEvent.click(screen.getByText("Create marker"));

    expect(onAutoCreate).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("advances to ad picker step when STATIC is selected and Next is clicked", () => {
    renderDialog();

    fireEvent.click(screen.getByText("Static"));
    fireEvent.click(screen.getByText("Next"));

    expect(screen.getByText("Assign ads")).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    renderDialog();

    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});
