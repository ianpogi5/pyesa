import { NavLink } from "react-router-dom";
import { FiMusic, FiBook, FiHeart } from "react-icons/fi";

const tabs = [
  { to: "/sets", icon: FiMusic, label: "Sets" },
  { to: "/library", icon: FiBook, label: "Library" },
  { to: "/rosario", icon: FiHeart, label: "Rosario" },
];

export default function BottomTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-mantle border-t border-surface safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? "text-blue" : "text-overlay hover:text-text"
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
