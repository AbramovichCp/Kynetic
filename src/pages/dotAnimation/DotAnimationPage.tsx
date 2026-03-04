import { Link } from "react-router-dom";

export default function DotAnimationPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground dark">
      <Link
        to="/"
        className="absolute left-4 top-4 z-10 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-md hover:bg-muted hover:text-foreground"
      >
        ← Home
      </Link>
      <p className="text-muted-foreground">Dot Animation — coming soon</p>
    </div>
  );
}
