import { Link } from "react-router-dom";

const ANIMATIONS = [
  {
    title: "Kinetic Text",
    description:
      "Chaotic letters drift across the canvas and periodically converge to form a target word, then scatter again.",
    path: "/kinetic",
    preview: "ABC",
  },
  {
    title: "Dot Formation",
    description:
      "Fedrigoni 365-style dots forming text in 3D space with rotation, depth, and connecting lines.",
    path: "/dots",
    preview: "•••",
  },
  {
    title: "LiteraSphere",
    description:
      "A rotating 3D sphere composed of floating digits and letters — Matrix digital sphere aesthetic with depth-based opacity.",
    path: "/litera-sphere",
    preview: "01A",
  },
  {
    title: "LetterVortex",
    description:
      "Letters fly chaotically around a central axis, then smoothly converge and assemble into a target word. After holding, they scatter and the cycle repeats.",
    path: "/letter-vortex",
    preview: "N3",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground dark">
      <header className="flex w-full flex-col items-center gap-2 border-b border-border px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">Kynetic</h1>
        <p className="text-muted-foreground">
          Choose an animation to configure and preview
        </p>
      </header>

      <main className="mx-auto grid w-full max-w-4xl gap-6 p-8 sm:grid-cols-2">
        {ANIMATIONS.map((anim) => (
          <Link
            key={anim.path}
            to={anim.path}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
          >
            {/* Preview area */}
            <div className="flex h-48 items-center justify-center bg-black text-5xl font-bold text-white/70 transition-colors group-hover:text-white">
              {anim.preview}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1.5 p-5">
              <h2 className="text-lg font-semibold">{anim.title}</h2>
              <p className="text-sm text-muted-foreground">
                {anim.description}
              </p>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
