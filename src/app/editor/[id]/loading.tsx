import Spinner from "@/app/_components/ui/Spinner";

export default function EditorLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
