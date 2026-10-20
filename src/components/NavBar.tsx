import { Link, NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import EditionToggle from "./EditionToggle";
import SearchBox from "./SearchBox";

const links = [
  { to: "/", label: "Cover", end: true },
  { to: "/games", label: "Index", end: false },
  { to: "/backlog", label: "My backlog", end: false },
];

const NavBar = () => {
  const onCover = useLocation().pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-7">
        {!onCover && (
          <Link to="/" className="wide text-[22px] font-black tracking-[-0.035em] whitespace-nowrap uppercase">
            Continue<span className="text-house">?</span>
          </Link>
        )}
        <nav className="flex gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn("label px-2.5 py-1.5 whitespace-nowrap", isActive ? "bg-ink text-paper" : "hover:bg-tint")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 max-sm:order-last max-sm:w-full">
          <SearchBox className="w-full sm:w-64" />
          <EditionToggle />
        </div>
      </div>
    </header>
  );
};

export default NavBar;
