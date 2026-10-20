import { Outlet, ScrollRestoration } from "react-router";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";

const Layout = () => {
  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr_auto]">
      <NavBar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
};

export default Layout;
