import { isRouteErrorResponse, useRouteError } from "react-router";
import Footer from "../components/Footer";
import GameOver from "../components/GameOver";
import NavBar from "../components/NavBar";

const ErrorPage = () => {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

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
