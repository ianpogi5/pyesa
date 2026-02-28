import { useTheme } from "../contexts/ThemeContext";
import useOnlineStatus from "../hooks/useOnlineStatus";
import {
  FiSun,
  FiMoon,
  FiWifiOff,
  FiArrowLeft,
  FiDownload,
  FiMusic,
  FiBook,
  FiHeart,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Header({ title, showBack, onBack }) {
  const { dark, toggle } = useTheme();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const navTabs = [
    { to: "/sets", icon: FiMusic, label: "Sets" },
    { to: "/library", icon: FiBook, label: "Library" },
    { to: "/rosario", icon: FiHeart, label: "Rosario" },
  ];

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center gap-2 px-3 py-2.5 bg-mantle border-b border-surface shadow-sm md:px-4 md:py-3">
      {showBack && (
        <button
          onClick={handleBack}
          className="shrink-0 p-1.5 rounded-lg hover:bg-surface active:bg-surface-hover transition-colors md:hidden"
          aria-label="Go back"
        >
          <FiArrowLeft size={20} />
        </button>
      )}

      <div className="flex items-center gap-2 min-w-0 shrink">
        <h1 className="text-lg font-bold text-text md:text-xl shrink-0">
          Pyesa
        </h1>
        {title && title !== "Pyesa" && (
          <>
            <span className="text-overlay hidden md:inline">/</span>
            <span className="text-sm text-subtext truncate hidden md:inline">
              {title}
            </span>
          </>
        )}
      </div>

      {/* Nav tabs */}
      <nav className="hidden md:flex items-center gap-1 mx-4">
        {navTabs.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-blue/10 text-blue"
                  : "text-overlay hover:text-text hover:bg-surface"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        {!isOnline && (
          <span className="flex items-center gap-1 text-xs text-overlay px-2 py-1 bg-surface rounded-full">
            <FiWifiOff size={12} />
            <span className="hidden sm:inline">Offline</span>
          </span>
        )}

        {installPrompt && !isInstalled && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1 text-xs font-medium text-green px-2.5 py-1.5 bg-green/10 rounded-full hover:bg-green/20 active:bg-green/30 transition-colors"
          >
            <FiDownload size={14} />
            <span>Install</span>
          </button>
        )}

        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-surface active:bg-surface-hover transition-colors"
          aria-label="Toggle dark mode"
        >
          {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
      </div>
    </header>
  );
}
