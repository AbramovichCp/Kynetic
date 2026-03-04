import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const HomePage = lazy(() => import("./pages/HomePage"));
const KineticAnimationPage = lazy(
  () => import("./pages/kineticAnimation/KineticAnimationPage"),
);
const DotAnimationPage = lazy(
  () => import("./pages/dotAnimation/DotAnimationPage"),
);

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground dark">
          Loading…
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/kinetic" element={<KineticAnimationPage />} />
        <Route path="/dots" element={<DotAnimationPage />} />
      </Routes>
    </Suspense>
  );
}
