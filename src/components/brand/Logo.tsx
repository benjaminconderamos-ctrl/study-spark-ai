import { Link } from "@tanstack/react-router";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="inline-flex items-baseline gap-1.5 group">
      <span className="font-serif text-2xl tracking-tight text-foreground">StudyFlow</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">AI</span>
    </Link>
  );
}
