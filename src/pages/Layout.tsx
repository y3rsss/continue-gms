import { Outlet, ScrollRestoration } from "react-router";
import NavBar from "../components/NavBar";

const Layout = () => {
  return (
    <>
      <NavBar />
      <Outlet />
      <ScrollRestoration />
    </>
  );
};

export default Layout;
