import { useEffect, useState } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { newerVersion, reloadInto } from "@/lib/reload";
import Footer from "../components/Footer";
import GameOver from "../components/GameOver";
import NavBar from "../components/NavBar";

const ErrorPage = () => {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const [checking, setChecking] = useState(!notFound);

  useEffect(() => {
    if (notFound) return;
    let cancelled = false;
    void newerVersion().then((version) => {
      if (cancelled || (version && reloadInto(version))) return;
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [notFound]);

  if (checking) return null;

  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr_auto]">
      <title>Game over | Continue?</title>
      <NavBar />
      <main>
        <GameOver
          message={
            notFound
              ? "This page doesn't exist."
              : "Something broke on our side. Reload the page to try again."
          }
        />
      </main>
      <Footer />
    </div>
  );
};

export default ErrorPage;
