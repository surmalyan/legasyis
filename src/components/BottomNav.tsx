import { useI18n } from "@/lib/i18n";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Home, User, GitBranch, Mic } from "lucide-react";

const BottomNav = () => {
  const { lang } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: "/", label: lang === "ru" ? "Главная" : "Home", icon: Home },
    { path: "/profile", label: lang === "ru" ? "Анкета" : "Profile", icon: User },
    { path: "/voice-library", label: lang === "ru" ? "Голос" : "Voice", icon: Mic },
    { path: "/family-tree", label: lang === "ru" ? "Древо" : "Tree", icon: GitBranch },
    { path: "/archive", label: lang === "ru" ? "Архив" : "Archive", icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
