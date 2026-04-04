import Logo from "../ui/Logo";

export default function Footer() {
  return (
    <footer className="flex items-center justify-between border-t border-border-default bg-surface px-8 py-4">
      <span className="text-sm text-text-muted">Video first podcasts</span>
      <Logo />
    </footer>
  );
}
