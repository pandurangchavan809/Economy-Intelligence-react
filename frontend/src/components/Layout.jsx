import { Link, NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/gemini", label: "Gemini" },
  { to: "/world", label: "World" },
  { to: "/continents", label: "Continents" },
  { to: "/countries", label: "Countries" },
  { to: "/admin", label: "Admin" }
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-sand text-ink">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,90,179,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(97,211,255,0.18),_transparent_35%),radial-gradient(circle_at_center,_rgba(143,93,255,0.15),_transparent_45%),linear-gradient(180deg,_#05030d_0%,_#0a0613_50%,_#05030d_100%)]" />
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link to="/" className="max-w-xs">
            <p className="font-display text-2xl font-semibold tracking-wide text-ink">
              Economy Intelligence
            </p>
            <p className="text-sm text-ink/60">World, continent, country and Gemini analysis</p>
          </Link>
          <div className="flex w-full gap-2 overflow-x-auto rounded-full border border-white/10 bg-mist/70 p-2 shadow-card lg:w-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-[linear-gradient(135deg,_#ff5ab3,_#8f5dff,_#61d3ff)] text-sand"
                      : "text-ink/70 hover:bg-white/5"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-16 lg:px-8">{children}</main>
    </div>
  );
}
