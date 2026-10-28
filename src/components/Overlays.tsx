import { lazy, Suspense } from "react";
import Toaster from "./Toaster";

const AuthDialog = lazy(() => import("./auth/AuthDialog"));

const Overlays = () => (
  <>
    <Suspense fallback={null}>
      <AuthDialog />
    </Suspense>
    <Toaster />
  </>
);

export default Overlays;
